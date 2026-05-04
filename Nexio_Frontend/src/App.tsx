/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Download,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  X,
  Zap,
  Archive,
  ChevronDown,
  User,
  LogOut,
  Sofa,
  Gem,
  Smartphone,
  Shirt,
  Package,
  Heart,
  Columns2,
  Trophy,
} from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import confetti from 'canvas-confetti';
import { getVariationsForCategory, CATEGORIES, CategoryType, AdVariation } from './constants';
import { generateAdImage } from './services/aiService';
import { generateListing, ListingResult, Language, Tone, ListingLength } from './services/listingService';
import { scoreVariations, VariationScore } from './services/scoringService';
import { exportProductKit, EXPORT_PRESETS, ExportPlatform } from './services/exportService';
import { ListingPanel } from './components/ListingPanel';
import { BulkScreen } from './components/BulkScreen';
import { InsightsPanel } from './components/InsightsPanel';
import { trackEvent, getRecommendations, type IntelligenceResult } from './services/analyticsService';

const ICON_MAP: Record<string, any> = { Sofa, Gem, Smartphone, Shirt, Package };

const PLATFORM_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  amazon:    { bg: 'bg-amber-500',  text: 'text-black' },
  instagram: { bg: 'bg-pink-600',   text: 'text-white' },
  etsy:      { bg: 'bg-orange-500', text: 'text-white' },
  tiktok:    { bg: 'bg-cyan-400',   text: 'text-black' },
};

type AppMode = 'catalog' | 'listing' | 'bulk';

export default function App() {
  const { user, signOut } = useAuth();

  const [mode, setMode] = useState<AppMode>('catalog');

  // Listing state
  const [listingLanguage, setListingLanguage] = useState<Language>('English');
  const [listingTone, setListingTone] = useState<Tone>('professional');
  const [listingLength, setListingLength] = useState<ListingLength>('medium');
  const [listingResult, setListingResult] = useState<ListingResult | null>(null);
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  // Catalog state
  const [sourceImage, setSourceImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Furniture');
  const [variations, setVariations] = useState<AdVariation[]>(
    getVariationsForCategory('Furniture').map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9), status: 'idle' as const }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Scoring state
  const [imageScores, setImageScores] = useState<Record<string, VariationScore> | null>(null);
  const [overallBestType, setOverallBestType] = useState<string | null>(null);

  // Intelligence state
  const [insights, setInsights] = useState<IntelligenceResult | null>(null);

  // Favorites + A/B compare state
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Export state
  const [exportPlatform, setExportPlatform] = useState<ExportPlatform>('full');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSourceImage({ base64: base64.split(',')[1], mimeType: file.type, name: file.name });
      setVariations(getVariationsForCategory(selectedCategory).map(t => ({
        ...t, id: Math.random().toString(36).substr(2, 9), status: 'idle' as const,
      })));
      setImageScores(null);
      setOverallBestType(null);
    };
    reader.readAsDataURL(file);
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
  } as any);

  const handleCategoryChange = (catId: CategoryType) => {
    setSelectedCategory(catId);
    setVariations(getVariationsForCategory(catId).map(t => ({
      ...t, id: Math.random().toString(36).substr(2, 9), status: 'idle' as const,
    })));
    setImageScores(null);
    setOverallBestType(null);
    trackEvent({ category: catId, event_type: 'select_style' });
    getRecommendations(catId).then(r => { if (r) setInsights(r); }).catch(() => {});
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsGenerating(true);
    setImageScores(null);
    setOverallBestType(null);
    setFavorites(new Set());
    setCompareA(null);
    setCompareB(null);

    // Phase 6: sort variations by recommendation rank before generating
    let workingVars = variations.map(v => ({ ...v, status: 'idle' as const, imageUrl: undefined }));
    if (insights?.top_recommendations.length) {
      const rankMap = new Map(insights.top_recommendations.map((r, i) => [r.style, i]));
      workingVars.sort((a, b) => (rankMap.get(a.type) ?? 99) - (rankMap.get(b.type) ?? 99));
    }
    setVariations(workingVars);

    const generatePromises = workingVars.map(async (variation) => {
      setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'generating' } : v));
      try {
        const imageUrl = await generateAdImage(sourceImage.base64, sourceImage.mimeType, variation.prompt);
        setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'completed', imageUrl } : v));
      } catch (error) {
        console.error(`Failed to generate ${variation.type}:`, error);
        setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'error' } : v));
      }
    });

    await Promise.all(generatePromises);
    setIsGenerating(false);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#818cf8', '#312e81'] });

    scoreVariations(workingVars, selectedCategory)
      .then(result => {
        if (result.overall_best) {
          setImageScores(result.scores);
          setOverallBestType(result.overall_best);
        }
      })
      .catch(() => {});
  };

  function toggleFavorite(v: AdVariation) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(v.id)) {
        next.delete(v.id);
      } else {
        next.add(v.id);
        trackEvent({ category: selectedCategory, event_type: 'favorite_variant', variant_id: v.id, style: v.type });
      }
      return next;
    });
  }

  function handleCompareSelect(id: string) {
    if (compareA === id) { setCompareA(null); return; }
    if (compareB === id) { setCompareB(null); return; }
    if (!compareA) { setCompareA(id); return; }
    if (!compareB) { setCompareB(id); return; }
    setCompareA(id); setCompareB(null);
  }

  function pickCompareWinner(winner: AdVariation, loser: AdVariation) {
    trackEvent({ category: selectedCategory, event_type: 'favorite_variant', variant_id: winner.id, style: winner.type });
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: selectedCategory, event_type: 'ab_select',
        variant_id: winner.id, style: winner.type,
        platform: `vs_${loser.type}`, timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
    setShowCompare(false);
    setCompareA(null);
    setCompareB(null);
  }

  const handleGenerateListing = async () => {
    if (!sourceImage) return;
    setIsGeneratingListing(true);
    setListingResult(null);
    setListingError(null);
    try {
      const result = await generateListing({
        image: { base64: sourceImage.base64, mimeType: sourceImage.mimeType },
        category: selectedCategory,
        language: listingLanguage,
        tone: listingTone,
        length: listingLength,
      });
      setListingResult(result);
    } catch (err) {
      setListingError(err instanceof Error ? err.message : 'Unknown error');
    }
    setIsGeneratingListing(false);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    trackEvent({ category: selectedCategory, event_type: 'export_zip', platform: exportPlatform });
    try {
      await exportProductKit(variations, listingResult, exportPlatform);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
      setShowExportPanel(false);
    }
  };

  const downloadImage = (url: string, label: string, variationId?: string, style?: string) => {
    trackEvent({ category: selectedCategory, event_type: 'download_image', variant_id: variationId, style });
    const link = document.createElement('a');
    link.href = url;
    link.download = `adgenius-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedVariations = variations.filter(v => v.imageUrl);

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">A</div>
          <span className="text-xl font-semibold tracking-tight text-white">Ad<span className="text-indigo-500 underline decoration-2 underline-offset-4">Genius</span> Catalog</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-1">
          {(['listing', 'catalog', 'bulk'] as AppMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${mode === m ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-200'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col items-end">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter leading-none mb-1">
              {user?.role === 'admin' ? 'ADMIN' : 'PRO PLAN'}
            </p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
            <User size={18} />
          </div>
          <button onClick={signOut} title="Sign out"
            className="w-9 h-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Bulk mode — full width, no sidebar */}
        {mode === 'bulk' && <BulkScreen />}

        {/* Sidebar — hidden in bulk mode */}
        <aside className={`w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20 flex-shrink-0 ${mode === 'bulk' ? 'hidden' : ''}`}>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            <div>
              <label className="sidebar-label">Product Source</label>
              <div {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-zinc-900/50 hover:border-indigo-500/50 transition-all cursor-pointer group ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700'}`}>
                <input {...getInputProps()} />
                {sourceImage ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 truncate max-w-[150px]">{sourceImage.name}</p>
                    <p className="text-xs text-indigo-400 mt-1 uppercase tracking-tighter font-bold group-hover:text-indigo-300 transition-colors">Change Product</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-400">Upload product</p>
                      <p className="text-xs text-zinc-600 mt-1 uppercase tracking-tighter">for visualization</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="sidebar-label">Product Category</label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = ICON_MAP[cat.icon] || Package;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 text-sm ${isSelected ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-medium' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500 text-zinc-300'}`}>
                      <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-zinc-500'} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intelligence insights */}
            {insights && insights.top_recommendations.length > 0 && (
              <div className="border-t border-zinc-800 pt-5">
                <InsightsPanel data={insights} category={selectedCategory} />
              </div>
            )}

            {/* Listing-only controls */}
            {mode === 'listing' && (
              <div className="space-y-4">
                {(['Language', 'Tone', 'Length'] as const).map(field => {
                  const opts = field === 'Language' ? ['English', 'Turkish', 'Spanish', 'German'] :
                               field === 'Tone' ? ['professional', 'luxury', 'casual', 'fun'] :
                               ['short', 'medium', 'long'];
                  const val = field === 'Language' ? listingLanguage : field === 'Tone' ? listingTone : listingLength;
                  const setter = field === 'Language' ? (v: any) => setListingLanguage(v) :
                                 field === 'Tone' ? (v: any) => setListingTone(v) :
                                 (v: any) => setListingLength(v);
                  return (
                    <div key={field}>
                      <label className="sidebar-label">{field}</label>
                      <select value={val} onChange={e => setter(e.target.value)}
                        className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none">
                        {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Always-visible generate button */}
          <div className="flex-shrink-0 p-6 border-t border-zinc-800 bg-zinc-900/40">
            {mode === 'catalog' ? (
              <button onClick={handleGenerate} disabled={!sourceImage || isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!sourceImage || isGenerating ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}>
                {isGenerating ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Visualizing...</> : <>Generate Catalog <Zap className="w-4 h-4" /></>}
              </button>
            ) : (
              <button onClick={handleGenerateListing} disabled={!sourceImage || isGeneratingListing}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!sourceImage || isGeneratingListing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}>
                {isGeneratingListing ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Generating...</> : <>Generate Listing <Sparkles className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </aside>

        {/* Listing Panel */}
        {mode === 'listing' && (
          <section className="flex-1 flex flex-col overflow-hidden bg-zinc-950/20">
            <ListingPanel listing={listingResult} isGenerating={isGeneratingListing} error={listingError}
              onRegenerate={() => { setListingResult(null); setListingError(null); }}
              onCopyPlatform={(platform) => trackEvent({ category: selectedCategory, event_type: 'copy_listing', platform })} />
          </section>
        )}

        {/* Catalog Content */}
        <section className={`flex-1 p-8 overflow-y-auto bg-zinc-950/20 ${mode !== 'catalog' ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light tracking-tight text-white flex items-center gap-3">
              Catalog Variants
              <span className="text-zinc-600 text-lg font-mono">/ {variations.length.toString().padStart(2, '0')}</span>
            </h2>

            <div className="flex gap-2 items-center relative">
              {compareA && compareB && (
                <button onClick={() => setShowCompare(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                  <Columns2 size={14} />
                  Compare A vs B
                </button>
              )}
              <button
                onClick={() => completedVariations.forEach(v => downloadImage(v.imageUrl!, v.label, v.id, v.type))}
                disabled={completedVariations.length === 0}
                className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                Download All
              </button>

              {/* Export ZIP button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportPanel(p => !p)}
                  disabled={completedVariations.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Archive size={14} />
                  Export ZIP
                  <ChevronDown size={12} className={`transition-transform ${showExportPanel ? 'rotate-180' : ''}`} />
                </button>

                {/* Export dropdown */}
                <AnimatePresence>
                  {showExportPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Export Preset</p>
                        <div className="space-y-1 mb-4">
                          {EXPORT_PRESETS.map(p => (
                            <button key={p.id} onClick={() => setExportPlatform(p.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${exportPlatform === p.id ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300' : 'hover:bg-zinc-800 text-zinc-400 border border-transparent'}`}>
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${exportPlatform === p.id ? 'border-indigo-400' : 'border-zinc-600'}`}>
                                {exportPlatform === p.id && <span className="w-2 h-2 rounded-full bg-indigo-400 block" />}
                              </span>
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {!listingResult && (
                          <p className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                            Generate a listing first to include copy files in the ZIP.
                          </p>
                        )}

                        <button onClick={handleExportZip} disabled={isExporting}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                          {isExporting ? <><RefreshCcw size={14} className="animate-spin" /> Building…</> : <><Archive size={14} /> Download ZIP</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {variations.map((variation, index) => {
                const score = imageScores?.[variation.type];
                const isOverallBest = overallBestType === variation.type;
                const topPlatform = !isOverallBest ? score?.best_for?.[0] : undefined;
                const showBadge = variation.status === 'completed' && !!score && (isOverallBest || !!topPlatform);
                const badgeColors = topPlatform ? (PLATFORM_BADGE_COLORS[topPlatform] ?? { bg: 'bg-zinc-700', text: 'text-zinc-300' }) : null;

                // Phase 4: conversion label from intelligence
                const recRank = insights?.top_recommendations.findIndex(r => r.style === variation.type) ?? -1;
                const convRec = recRank >= 0 ? insights!.top_recommendations[recRank] : null;

                // A/B compare state
                const isCompareA = compareA === variation.id;
                const isCompareB = compareB === variation.id;
                const isFav = favorites.has(variation.id);

                return (
                  <motion.div key={variation.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`group relative rounded-2xl overflow-hidden bg-zinc-900 flex flex-col min-h-[280px] border transition-colors ${
                      isCompareA ? 'border-amber-500/70' : isCompareB ? 'border-sky-500/70' : 'border-zinc-800'
                    }`}>
                    <div className="aspect-video bg-zinc-900 relative flex items-center justify-center overflow-hidden border-b border-zinc-800/50">
                      {variation.status === 'generating' && (
                        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6 text-center">
                          <div className="w-12 h-12 relative flex items-center justify-center mb-4">
                            <motion.div className="absolute inset-0 rounded-full border-t-2 border-indigo-500"
                              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                            <Zap size={20} className="text-indigo-400" />
                          </div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Processing</p>
                        </div>
                      )}

                      {variation.status === 'error' && (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <AlertCircle className="text-red-500 opacity-50 mb-3" size={32} />
                          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Error</p>
                          <p className="text-[10px] text-zinc-500">Service temporarily unavailable</p>
                        </div>
                      )}

                      {variation.imageUrl ? (
                        <>
                          <img src={variation.imageUrl} alt={variation.label}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer" />

                          {/* AI scoring badge — top left */}
                          {showBadge && (
                            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isOverallBest ? 'bg-indigo-600 text-white' : `${badgeColors!.bg} ${badgeColors!.text}`}`}>
                              {isOverallBest ? '★ BEST' : topPlatform!.toUpperCase()}
                            </div>
                          )}

                          {/* Phase 4: conversion label — top right */}
                          {convRec && variation.status === 'completed' && (
                            <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              recRank === 0 ? 'bg-emerald-600 text-white' :
                              recRank === 1 ? 'bg-teal-600 text-white' :
                              'bg-zinc-700 text-zinc-300'
                            }`}>
                              <Trophy size={9} />
                              {convRec.conversion_score.toFixed(1)}
                            </div>
                          )}

                          {/* A/B label */}
                          {(isCompareA || isCompareB) && (
                            <div className={`absolute bottom-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isCompareA ? 'bg-amber-500 text-black' : 'bg-sky-500 text-white'}`}>
                              {isCompareA ? 'A' : 'B'}
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                            <button onClick={() => setSelectedImage(variation.imageUrl!)}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all transform translate-y-2 group-hover:translate-y-0">
                              <Maximize2 size={18} />
                            </button>
                            <button onClick={() => downloadImage(variation.imageUrl!, variation.label, variation.id, variation.type)}
                              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold text-white transition-all transform translate-y-2 group-hover:translate-y-0 delay-75 shadow-xl shadow-indigo-600/30">
                              Export Image
                            </button>
                          </div>
                        </>
                      ) : variation.status === 'idle' ? (
                        <div className="flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity p-8 text-center bg-zinc-950/20 w-full h-full">
                          <div className="w-32 h-32 bg-zinc-800/30 rounded-full blur-3xl absolute -z-10 group-hover:bg-indigo-600/10 transition-colors" />
                          <p className="font-serif italic text-zinc-500 relative text-xl mb-2">{variation.label}</p>
                          <p className="text-[10px] uppercase tracking-[3px] font-bold text-zinc-600">Pending</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4 flex items-center justify-between flex-shrink-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">
                          {(index + 1).toString().padStart(2, '0')} . {variation.type}
                        </span>
                        <h3 className="text-xs font-bold text-zinc-200">{variation.label}</h3>
                        {convRec && (
                          <p className="text-[10px] text-indigo-400 mt-0.5">{convRec.confidence} conversion · {convRec.usage_count} uses</p>
                        )}
                        {!convRec && score && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">{score.label}</p>
                        )}
                      </div>
                      {variation.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          {/* A/B compare selector */}
                          <button onClick={() => handleCompareSelect(variation.id)} title="Add to A/B compare"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black transition-colors ${
                              isCompareA ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                              isCompareB ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' :
                              'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'
                            }`}>
                            {isCompareA ? 'A' : isCompareB ? 'B' : <Columns2 size={12} />}
                          </button>

                          {/* Favorite */}
                          <button onClick={() => toggleFavorite(variation)} title="Favorite"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                              isFav ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/40'
                            }`}>
                            <Heart size={13} className={isFav ? 'fill-current' : ''} />
                          </button>

                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-10 bg-zinc-950 border-t border-zinc-800 flex items-center px-8 justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-[2px]">
          <span className="flex items-center gap-1.5">GPU Status: <span className="text-emerald-500 font-bold">OPTIMAL</span></span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <span>Cloud Compute: Connected</span>
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">AdGenius-v2.2.0-stbl</div>
      </footer>

      {/* A/B Compare Modal — Phase 5 */}
      <AnimatePresence>
        {showCompare && compareA && compareB && (() => {
          const varA = variations.find(v => v.id === compareA);
          const varB = variations.find(v => v.id === compareB);
          if (!varA || !varB) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-[#09090b]/97 backdrop-blur-md">
              <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">A/B Compare · {selectedCategory}</p>
                  <h3 className="text-lg font-light text-white">Which image performs better?</h3>
                </div>
                <button onClick={() => setShowCompare(false)}
                  className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 flex gap-4 p-8 overflow-hidden">
                {[{ v: varA, label: 'A', color: 'amber' }, { v: varB, label: 'B', color: 'sky' }].map(({ v, label, color }) => (
                  <div key={v.id} className="flex-1 flex flex-col gap-4">
                    <div className={`flex-1 rounded-2xl overflow-hidden border-2 ${color === 'amber' ? 'border-amber-500/40' : 'border-sky-500/40'}`}>
                      <img src={v.imageUrl!} alt={v.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-400 mb-1">{v.label}</p>
                      <button
                        onClick={() => pickCompareWinner(v, v.id === varA.id ? varB : varA)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          color === 'amber'
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-sky-500 hover:bg-sky-400 text-white'
                        }`}>
                        {label} Wins
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 pb-6 text-center">
                <p className="text-xs text-zinc-600">Your pick is recorded and improves future recommendations for <span className="text-zinc-400">{selectedCategory}</span>.</p>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-[#09090b]/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}>
            <button className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors">
              <X size={32} />
            </button>
            <motion.div layoutId="fullscreen-image" className="relative max-w-7xl w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="Enlarged variant"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(79,70,229,0.2)]"
                referrerPolicy="no-referrer" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close export panel on outside click */}
      {showExportPanel && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExportPanel(false)} />
      )}
    </div>
  );
}
