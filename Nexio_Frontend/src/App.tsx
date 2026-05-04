import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, Download, RefreshCcw, AlertCircle, CheckCircle2,
  Maximize2, X, Zap, Archive, ChevronDown, Package, Heart, Columns2,
  Trophy, Plus, Clock, Image as ImageIcon, FileText, Store,
  Sofa, Gem, Smartphone, Shirt, BarChart3, TrendingUp, Eye, MousePointer, MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getVariationsForCategory, CATEGORIES, CategoryType, AdVariation } from './constants';
import { generateAdImage } from './services/aiService';
import { generateListing, ListingResult } from './services/listingService';
import { scoreVariations, VariationScore } from './services/scoringService';
import { exportProductKit, EXPORT_PRESETS, ExportPlatform } from './services/exportService';
import { ListingPanel } from './components/ListingPanel';
import { InsightsPanel } from './components/InsightsPanel';
import { trackEvent, getRecommendations, type IntelligenceResult } from './services/analyticsService';
import { Sidebar, type SidebarView } from './components/Sidebar';

const ICON_MAP: Record<string, any> = { Sofa, Gem, Smartphone, Shirt, Package };

const PLATFORM_BADGE: Record<string, { bg: string; color: string }> = {
  amazon:    { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  instagram: { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899' },
  etsy:      { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
  tiktok:    { bg: 'rgba(34,211,238,0.15)',  color: '#22d3ee' },
};

// ── Image filter tabs for kit view ────────────────────────────────────────────
const IMAGE_FILTERS = ['All', 'Studio', 'Lifestyle', 'Close-up', 'Creative'] as const;
type ImageFilter = typeof IMAGE_FILTERS[number];

const FILTER_TYPE_MAP: Record<string, string[]> = {
  'Studio':   ['studio_stand', 'main_shot'],
  'Lifestyle':['lifestyle_scene', 'human_interaction'],
  'Close-up': ['macro_detail'],
  'Creative': ['hand_held'],
};

// ── Kit tab type ───────────────────────────────────────────────────────────────
type KitTab = 'images' | 'listing' | 'etsy' | 'amazon' | 'instagram';

// ── Mock recent kits for dashboard ────────────────────────────────────────────
const MOCK_KITS = [
  { id: '1', name: 'Gold Necklace',    category: 'Jewelry',    images: 6, thumb: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop', updatedAt: '2h ago' },
  { id: '2', name: 'Minimalist Ring',  category: 'Jewelry',    images: 6, thumb: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop', updatedAt: '5h ago' },
  { id: '3', name: 'Leather Handbag',  category: 'Fashion',    images: 6, thumb: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop', updatedAt: '1d ago' },
  { id: '4', name: 'Ceramic Vase',     category: 'Home Decor', images: 4, thumb: 'https://images.unsplash.com/photo-1612196808214-b7e239e5f5a4?w=300&h=300&fit=crop', updatedAt: '2d ago' },
];

const STATS = [
  { label: 'Product Kits',       value: '128',   delta: '+12%', icon: Package },
  { label: 'Images Generated',   value: '1,248', delta: '+18%', icon: ImageIcon },
  { label: 'Listings Created',   value: '342',   delta: '-9%',  icon: FileText },
  { label: 'Store Views',        value: '8,652', delta: '+24%', icon: Eye },
];

const ANALYTICS_STYLES = [
  { name: 'Luxury Branding', score: 4.7 },
  { name: 'Close-up',        score: 4.2 },
  { name: 'Lifestyle',       score: 3.9 },
  { name: 'Minimalist',      score: 3.2 },
  { name: 'Creative',        score: 2.8 },
];

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handle}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: copied ? '#34d399' : 'var(--text-2)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}>
      {copied ? <CheckCircle2 size={12} /> : <Download size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [sideView, setSideView] = useState<SidebarView>('dashboard');
  const [appView, setAppView]   = useState<'dashboard' | 'kit'>('dashboard');
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genMode, setGenMode] = useState<'catalog' | 'listing'>('catalog');
  const [kitTab, setKitTab]     = useState<KitTab>('images');
  const [imgFilter, setImgFilter] = useState<ImageFilter>('All');

  // Generation state
  const [sourceImage, setSourceImage]   = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Furniture');
  const [variations, setVariations] = useState<AdVariation[]>(
    getVariationsForCategory('Furniture').map(t => ({ ...t, id: Math.random().toString(36).substr(2,9), status: 'idle' as const }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Listing state
  const [listingResult, setListingResult] = useState<ListingResult | null>(null);
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  // Scoring / intelligence
  const [imageScores, setImageScores] = useState<Record<string, VariationScore> | null>(null);
  const [overallBestType, setOverallBestType] = useState<string | null>(null);
  const [insights, setInsights] = useState<IntelligenceResult | null>(null);

  // Favorites + compare
  const [favorites, setFavorites]   = useState<Set<string>>(new Set());
  const [compareA, setCompareA]     = useState<string | null>(null);
  const [compareB, setCompareB]     = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Export
  const [exportPlatform, setExportPlatform] = useState<ExportPlatform>('full');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Current kit name (derived from listing or category)
  const kitName = listingResult?.global?.title?.split(/[\s,]+/).slice(0, 4).join(' ')
               || `${selectedCategory} Product`;

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      setSourceImage({ base64: base64.split(',')[1], mimeType: file.type, name: file.name });
      setVariations(getVariationsForCategory(selectedCategory).map(t => ({ ...t, id: Math.random().toString(36).substr(2,9), status: 'idle' as const })));
      setImageScores(null); setOverallBestType(null);
    };
    reader.readAsDataURL(file);
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
  } as any);

  // ── Category change ────────────────────────────────────────────────────────
  const handleCategoryChange = (catId: CategoryType) => {
    setSelectedCategory(catId);
    setVariations(getVariationsForCategory(catId).map(t => ({ ...t, id: Math.random().toString(36).substr(2,9), status: 'idle' as const })));
    setImageScores(null); setOverallBestType(null);
    trackEvent({ category: catId, event_type: 'select_style' });
    getRecommendations(catId).then(r => { if (r) setInsights(r); }).catch(() => {});
  };

  // ── Generate catalog ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsGenerating(true);
    setImageScores(null); setOverallBestType(null);
    setFavorites(new Set()); setCompareA(null); setCompareB(null);

    let workingVars = variations.map(v => ({ ...v, status: 'idle' as const, imageUrl: undefined }));
    if (insights?.top_recommendations.length) {
      const rankMap = new Map(insights.top_recommendations.map((r, i) => [r.style, i]));
      workingVars.sort((a, b) => (rankMap.get(a.type) ?? 99) - (rankMap.get(b.type) ?? 99));
    }
    setVariations(workingVars);

    await Promise.all(workingVars.map(async variation => {
      setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'generating' } : v));
      try {
        const imageUrl = await generateAdImage(sourceImage.base64, sourceImage.mimeType, variation.prompt);
        setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'completed', imageUrl } : v));
      } catch {
        setVariations(prev => prev.map(v => v.id === variation.id ? { ...v, status: 'error' } : v));
      }
    }));

    setIsGenerating(false);
    setShowGenPanel(false);
    setAppView('kit'); setKitTab('images');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6C5CE7','#8A7BFF','#a78bfa'] });

    scoreVariations(workingVars, selectedCategory)
      .then(r => { if (r.overall_best) { setImageScores(r.scores); setOverallBestType(r.overall_best); } })
      .catch(() => {});
  };

  // ── Generate listing ───────────────────────────────────────────────────────
  const handleGenerateListing = async () => {
    if (!sourceImage) return;
    setIsGeneratingListing(true); setListingResult(null); setListingError(null);
    try {
      const result = await generateListing({
        image: { base64: sourceImage.base64, mimeType: sourceImage.mimeType },
        category: selectedCategory,
        language: 'English', tone: 'professional', length: 'medium',
      });
      setListingResult(result);
      setShowGenPanel(false);
      setAppView('kit'); setKitTab('listing');
    } catch (err) {
      setListingError(err instanceof Error ? err.message : 'Unknown error');
    }
    setIsGeneratingListing(false);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function toggleFavorite(v: AdVariation) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(v.id)) next.delete(v.id);
      else { next.add(v.id); trackEvent({ category: selectedCategory, event_type: 'favorite_variant', variant_id: v.id, style: v.type }); }
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

  const downloadImage = (url: string, label: string, varId?: string, style?: string) => {
    trackEvent({ category: selectedCategory, event_type: 'download_image', variant_id: varId, style });
    const link = document.createElement('a');
    link.href = url; link.download = `nexio-${label.toLowerCase().replace(/\s+/g,'-')}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try { await exportProductKit(variations, listingResult, exportPlatform); }
    catch (e) { console.error('Export failed:', e); }
    finally { setIsExporting(false); setShowExportMenu(false); }
  };

  const completedVariations = variations.filter(v => v.imageUrl);

  const filteredVariations = imgFilter === 'All' ? variations
    : variations.filter(v => (FILTER_TYPE_MAP[imgFilter] ?? []).includes(v.type));

  // ── Determine main content ─────────────────────────────────────────────────
  const showDashboard  = appView === 'dashboard' && sideView === 'dashboard';
  const showAnalytics  = sideView === 'analytics';
  const showKitView    = appView === 'kit' && !showAnalytics;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <Sidebar active={sideView} onChange={v => { setSideView(v); if (v !== 'analytics') setAppView(appView); }} />

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <header style={{ height: 60, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0, background: 'var(--bg-secondary)' }}>
          <div>
            {showAnalytics && <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Analytics</h1>}
            {showKitView && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => { setAppView('dashboard'); setSideView('dashboard'); }}
                  style={{ fontSize: 13, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ← Back to Product Kits
                </button>
              </div>
            )}
            {showDashboard && (
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Dashboard</h1>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>Here's what's happening with your store today.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Generate button always visible */}
            <button onClick={() => setShowGenPanel(true)} className="btn-primary" style={{ height: 38, padding: '0 18px', fontSize: 13, borderRadius: 10 }}>
              <Plus size={14} /> New Kit
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* ═══════════ DASHBOARD ═══════════ */}
          {showDashboard && (
            <div style={{ padding: '28px 28px 60px' }}>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
                <button onClick={() => { setGenMode('catalog'); setShowGenPanel(true); }}
                  style={{ padding: '24px', borderRadius: 16, background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', border: 'none', cursor: 'pointer', textAlign: 'left', boxShadow: '0 8px 24px rgba(108,92,231,0.3)', transition: 'transform 0.15s, opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <ImageIcon size={18} color="#fff" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Generate Catalog</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Create multiple product images</p>
                </button>

                <button onClick={() => { setGenMode('listing'); setShowGenPanel(true); }}
                  style={{ padding: '24px', borderRadius: 16, background: 'var(--card-bg)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#1A1A2E'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <FileText size={18} color="var(--accent)" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Generate Listing</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Create marketplace listings</p>
                </button>
              </div>

              {/* Recent Product Kits */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Recent Product Kits</h2>
                <button onClick={() => setSideView('kits')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
                {MOCK_KITS.map(kit => (
                  <div key={kit.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,92,231,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <div style={{ width: '100%', aspectRatio: '1', background: '#1A1A2E', overflow: 'hidden' }}>
                      <img src={kit.thumb} alt={kit.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kit.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{kit.images} images</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} /> {kit.updatedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Overview */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Performance Overview</h2>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 30 Days</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {STATS.map(({ label, value, delta, icon: Icon }) => {
                  const isUp = delta.startsWith('+');
                  return (
                    <div key={label} className="card" style={{ padding: '20px 20px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{label}</p>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} color="var(--accent)" />
                        </div>
                      </div>
                      <p className="stat-value">{value}</p>
                      <p className={isUp ? 'stat-delta-up' : 'stat-delta-down'} style={{ marginTop: 4 }}>
                        {delta} vs last month
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ KIT VIEW ═══════════ */}
          {showKitView && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* Kit header */}
              <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1A1A2E', overflow: 'hidden', flexShrink: 0 }}>
                      {completedVariations[0]?.imageUrl
                        ? <img src={completedVariations[0].imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="var(--text-3)" /></div>}
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{kitName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{selectedCategory} · {completedVariations.length} images</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {compareA && compareB && (
                      <button onClick={() => setShowCompare(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#f59e0b', cursor: 'pointer' }}>
                        <Columns2 size={14} /> Compare A/B
                      </button>
                    )}
                    <button onClick={() => { setGenMode('catalog'); setShowGenPanel(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                      <RefreshCcw size={13} /> Generate More
                    </button>

                    {/* Export */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setShowExportMenu(p => !p)} disabled={completedVariations.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: completedVariations.length === 0 ? 0.4 : 1 }}>
                        <Archive size={13} /> Export <ChevronDown size={12} style={{ transform: showExportMenu ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
                      </button>
                      <AnimatePresence>
                        {showExportMenu && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 240, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Export Preset</p>
                            {EXPORT_PRESETS.map(p => (
                              <button key={p.id} onClick={() => setExportPlatform(p.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, background: exportPlatform === p.id ? 'rgba(108,92,231,0.12)' : 'transparent', border: exportPlatform === p.id ? '1px solid rgba(108,92,231,0.3)' : '1px solid transparent', fontSize: 13, color: exportPlatform === p.id ? '#a78bfa' : 'var(--text-2)', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                                <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${exportPlatform === p.id ? 'var(--accent)' : 'var(--text-3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {exportPlatform === p.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />}
                                </span>
                                {p.label}
                              </button>
                            ))}
                            <button onClick={handleExportZip} disabled={isExporting}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', marginTop: 10, background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: isExporting ? 0.6 : 1 }}>
                              {isExporting ? <><RefreshCcw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Building…</> : <><Archive size={13} /> Download ZIP</>}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Kit tabs */}
                <div className="tab-bar" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  {(['images', 'listing', 'etsy', 'amazon', 'instagram'] as KitTab[]).map(t => (
                    <button key={t} className={`tab ${kitTab === t ? 'active' : ''}`} onClick={() => setKitTab(t)} style={{ background: 'none', border: 'none', textTransform: 'capitalize' }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Images tab */}
                {kitTab === 'images' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Sub-filter tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 28px 10px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                      {IMAGE_FILTERS.map(f => {
                        const cnt = f === 'All' ? variations.length : (variations.filter(v => (FILTER_TYPE_MAP[f] ?? []).includes(v.type))).length;
                        return (
                          <button key={f} onClick={() => setImgFilter(f)}
                            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: imgFilter === f ? 'rgba(108,92,231,0.15)' : 'var(--card-bg)', border: `1px solid ${imgFilter === f ? 'rgba(108,92,231,0.4)' : 'var(--border)'}`, color: imgFilter === f ? '#a78bfa' : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s' }}>
                            {f} <span style={{ opacity: 0.7, marginLeft: 4 }}>({cnt})</span>
                          </button>
                        );
                      })}
                      {completedVariations.length > 0 && (
                        <button onClick={() => completedVariations.forEach(v => downloadImage(v.imageUrl!, v.label, v.id, v.type))}
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
                          <Download size={12} /> Download All
                        </button>
                      )}
                    </div>

                    {/* Image grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        <AnimatePresence mode="popLayout">
                          {filteredVariations.map((variation, index) => {
                            const score = imageScores?.[variation.type];
                            const isBest = overallBestType === variation.type;
                            const topPlatform = !isBest ? score?.best_for?.[0] : undefined;
                            const showBadge = variation.status === 'completed' && !!score && (isBest || !!topPlatform);
                            const platformStyle = topPlatform ? (PLATFORM_BADGE[topPlatform] ?? { bg: 'rgba(161,161,170,0.15)', color: '#a1a1aa' }) : null;
                            const recRank = insights?.top_recommendations.findIndex(r => r.style === variation.type) ?? -1;
                            const convRec = recRank >= 0 ? insights!.top_recommendations[recRank] : null;
                            const isCompareA = compareA === variation.id;
                            const isCompareB = compareB === variation.id;
                            const isFav = favorites.has(variation.id);

                            return (
                              <motion.div key={variation.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--card-bg)', border: `1px solid ${isCompareA ? 'rgba(245,158,11,0.6)' : isCompareB ? 'rgba(34,211,238,0.6)' : 'var(--border)'}`, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ aspectRatio: '4/3', background: '#0F0F18', position: 'relative', overflow: 'hidden' }}
                                  className="group">
                                  {variation.status === 'generating' && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,11,15,0.9)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                                      <motion.div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent)', marginBottom: 10 }}
                                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                                      <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Processing</p>
                                    </div>
                                  )}

                                  {variation.status === 'error' && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <AlertCircle size={28} color="#f87171" style={{ opacity: 0.5, marginBottom: 8 }} />
                                      <p style={{ fontSize: 11, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Error</p>
                                    </div>
                                  )}

                                  {variation.imageUrl ? (
                                    <>
                                      <img src={variation.imageUrl} alt={variation.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} referrerPolicy="no-referrer" />

                                      {/* Recommended badge */}
                                      {isBest && (
                                        <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 6, background: 'rgba(108,92,231,0.85)', backdropFilter: 'blur(4px)', fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                          ⭐ Recommended
                                        </div>
                                      )}

                                      {/* Best performing badge */}
                                      {showBadge && !isBest && platformStyle && (
                                        <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 6, background: platformStyle.bg, border: `1px solid ${platformStyle.color}30`, fontSize: 10, fontWeight: 800, color: platformStyle.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                          🔥 {topPlatform}
                                        </div>
                                      )}

                                      {/* Conversion score */}
                                      {convRec && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: recRank === 0 ? 'rgba(52,211,153,0.9)' : 'rgba(20,184,166,0.85)', backdropFilter: 'blur(4px)', fontSize: 10, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}>
                                          <Trophy size={9} /> {convRec.conversion_score.toFixed(1)}
                                        </div>
                                      )}

                                      {/* A/B pill */}
                                      {(isCompareA || isCompareB) && (
                                        <div style={{ position: 'absolute', bottom: 10, left: 10, width: 26, height: 26, borderRadius: '50%', background: isCompareA ? '#f59e0b' : '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#000' }}>
                                          {isCompareA ? 'A' : 'B'}
                                        </div>
                                      )}

                                      {/* Hover overlay */}
                                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', opacity: 0, transition: 'opacity 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(2px)' }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                                        <button onClick={() => setSelectedImage(variation.imageUrl!)}
                                          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                          <Maximize2 size={15} />
                                        </button>
                                        <button onClick={() => downloadImage(variation.imageUrl!, variation.label, variation.id, variation.type)}
                                          style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(108,92,231,0.4)' }}>
                                          <Download size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Download
                                        </button>
                                      </div>
                                    </>
                                  ) : variation.status === 'idle' ? (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                      <p style={{ fontStyle: 'italic', color: 'var(--text-2)', fontSize: 15, marginBottom: 4 }}>{variation.label}</p>
                                      <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Pending</p>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Card footer */}
                                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                  <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>{String(index + 1).padStart(2,'0')} · {variation.type}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{variation.label}</p>
                                    {convRec && <p style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>{convRec.confidence} conversion</p>}
                                  </div>
                                  {variation.status === 'completed' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <button onClick={() => handleCompareSelect(variation.id)}
                                        style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${isCompareA ? 'rgba(245,158,11,0.5)' : isCompareB ? 'rgba(34,211,238,0.5)' : 'var(--border)'}`, background: isCompareA ? 'rgba(245,158,11,0.1)' : isCompareB ? 'rgba(34,211,238,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 800, color: isCompareA ? '#f59e0b' : isCompareB ? '#22d3ee' : 'var(--text-3)' }}>
                                        {isCompareA ? 'A' : isCompareB ? 'B' : <Columns2 size={11} />}
                                      </button>
                                      <button onClick={() => toggleFavorite(variation)}
                                        style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${isFav ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`, background: isFav ? 'rgba(248,113,113,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isFav ? '#f87171' : 'var(--text-3)' }}>
                                        <Heart size={12} style={{ fill: isFav ? 'currentColor' : 'none' }} />
                                      </button>
                                      <CheckCircle2 size={14} color="#34d399" />
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Insights panel */}
                      {insights && insights.top_recommendations.length > 0 && (
                        <div style={{ marginTop: 28 }}>
                          <InsightsPanel data={insights} category={selectedCategory} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Listing / platform tabs */}
                {(kitTab === 'listing' || kitTab === 'etsy' || kitTab === 'amazon' || kitTab === 'instagram') && (
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <ListingPanel
                      listing={listingResult}
                      isGenerating={isGeneratingListing}
                      error={listingError}
                      onRegenerate={() => { setListingResult(null); setListingError(null); }}
                      onCopyPlatform={platform => trackEvent({ category: selectedCategory, event_type: 'copy_listing', platform })}
                    />
                    {!listingResult && !isGeneratingListing && !listingError && (
                      <div style={{ padding: '0 28px 28px' }}>
                        <button onClick={handleGenerateListing} disabled={!sourceImage || isGeneratingListing} className="btn-primary" style={{ width: '100%' }}>
                          {isGeneratingListing ? <><RefreshCcw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</> : <><Sparkles size={14} /> Generate Listing</>}
                        </button>
                        {!sourceImage && <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>Upload a product image first</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ ANALYTICS ═══════════ */}
          {showAnalytics && (
            <div style={{ padding: '28px 28px 60px' }}>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 32 }}>
                {[
                  { label: 'Store Views',         value: '8,652',  delta: '+28%', icon: Eye },
                  { label: 'Product Clicks',       value: '1,248',  delta: '+18%', icon: MousePointer },
                  { label: 'Chat Conversations',   value: '342',    delta: '+12%', icon: MessageSquare },
                  { label: 'Contact Clicks',       value: '128',    delta: '+15%', icon: Store },
                ].map(({ label, value, delta, icon: Icon }) => {
                  const isUp = delta.startsWith('+');
                  return (
                    <div key={label} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{label}</p>
                        <Icon size={14} color="var(--accent)" />
                      </div>
                      <p className="stat-value">{value}</p>
                      <p className={isUp ? 'stat-delta-up' : 'stat-delta-down'} style={{ marginTop: 4 }}>{delta}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Top performing styles */}
                <div className="card" style={{ padding: '22px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>Top Performing Styles</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ANALYTICS_STYLES.map(({ name, score }) => (
                      <div key={name}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{name}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{score.toFixed(1)}</p>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#6C5CE7,#8A7BFF)', width: `${(score / 5) * 100}%`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Views chart placeholder */}
                <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Views Over Time</p>
                    <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>+24% this month</div>
                  </div>
                  {/* Simple SVG sparkline */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                    {[30,45,38,62,55,75,68,82,74,91,85,100].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 11 ? 'linear-gradient(135deg,#6C5CE7,#8A7BFF)' : 'rgba(108,92,231,0.2)', transition: 'height 0.5s ease', minHeight: 4 }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    {['May 5','May 8','May 11','May 14','May 17','May 20'].map(d => (
                      <span key={d} style={{ fontSize: 10, color: 'var(--text-3)' }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder views */}
          {!showDashboard && !showKitView && !showAnalytics && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-3)' }}>
              <Package size={40} strokeWidth={1} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>{sideView.charAt(0).toUpperCase() + sideView.slice(1)}</p>
              <p style={{ fontSize: 12 }}>Coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ GENERATE PANEL (right-side drawer) ═══════════ */}
      <AnimatePresence>
        {showGenPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(3px)' }}
              onClick={() => setShowGenPanel(false)} />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>

              {/* Panel header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>New Product Kit</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Upload a photo to get started</p>
                </div>
                <button onClick={() => setShowGenPanel(false)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Panel body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* Mode toggle */}
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Generation Type</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([['catalog', 'Catalog Images', ImageIcon], ['listing', 'Listing Copy', FileText]] as const).map(([id, label, Icon]) => (
                      <button key={id} onClick={() => setGenMode(id)}
                        style={{ padding: '12px', borderRadius: 10, background: genMode === id ? 'rgba(108,92,231,0.12)' : 'var(--card-bg)', border: `1px solid ${genMode === id ? 'rgba(108,92,231,0.4)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                        <Icon size={18} color={genMode === id ? 'var(--accent)' : 'var(--text-3)'} style={{ marginBottom: 6 }} />
                        <p style={{ fontSize: 12, fontWeight: 700, color: genMode === id ? '#a78bfa' : 'var(--text-2)' }}>{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Product Photo</p>
                  <div {...getRootProps()}
                    style={{ border: `2px dashed ${isDragActive ? 'var(--accent)' : sourceImage ? 'rgba(108,92,231,0.4)' : 'var(--border)'}`, borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: isDragActive ? 'rgba(108,92,231,0.06)' : 'var(--card-bg)', transition: 'all 0.15s', minHeight: 140 }}>
                    <input {...getInputProps()} />
                    {sourceImage ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', margin: '0 auto 10px' }}>
                          <img src={`data:${sourceImage.mimeType};base64,${sourceImage.base64}`} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{sourceImage.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>Tap to change</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,92,231,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload size={18} color="var(--accent)" />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center' }}>Drop your product photo here</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>JPEG, PNG, WEBP — max 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Product Category</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {CATEGORIES.map(cat => {
                      const Icon = ICON_MAP[cat.icon] || Package;
                      const sel = selectedCategory === cat.id;
                      return (
                        <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: sel ? 'rgba(108,92,231,0.1)' : 'var(--card-bg)', border: `1px solid ${sel ? 'rgba(108,92,231,0.4)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                          <Icon size={15} color={sel ? 'var(--accent)' : 'var(--text-3)'} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: sel ? '#a78bfa' : 'var(--text-2)' }}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel CTA */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {genMode === 'catalog' ? (
                  <button onClick={handleGenerate} disabled={!sourceImage || isGenerating} className="btn-primary" style={{ width: '100%' }}>
                    {isGenerating
                      ? <><RefreshCcw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating… ({variations.filter(v => v.status === 'completed').length}/{variations.length})</>
                      : <><Zap size={15} /> Generate Catalog</>}
                  </button>
                ) : (
                  <button onClick={handleGenerateListing} disabled={!sourceImage || isGeneratingListing} className="btn-primary" style={{ width: '100%' }}>
                    {isGeneratingListing
                      ? <><RefreshCcw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                      : <><Sparkles size={15} /> Generate Listing</>}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════ A/B COMPARE MODAL ═══════════ */}
      <AnimatePresence>
        {showCompare && compareA && compareB && (() => {
          const varA = variations.find(v => v.id === compareA);
          const varB = variations.find(v => v.id === compareB);
          if (!varA || !varB) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: 'rgba(11,11,15,0.96)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>A/B Compare · {selectedCategory}</p>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Which image performs better?</h3>
                </div>
                <button onClick={() => setShowCompare(false)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
                  <X size={15} />
                </button>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 16, padding: '24px 32px', overflow: 'hidden' }}>
                {[{ v: varA, label: 'A', accent: '#f59e0b', dark: 'rgba(245,158,11,0.15)' }, { v: varB, label: 'B', accent: '#22d3ee', dark: 'rgba(34,211,238,0.15)' }].map(({ v, label, accent, dark }) => (
                  <div key={v.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: `2px solid ${accent}40` }}>
                      <img src={v.imageUrl!} alt={v.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>{v.label}</p>
                      <button onClick={() => { trackEvent({ category: selectedCategory, event_type: 'favorite_variant', variant_id: v.id, style: v.type }); setShowCompare(false); setCompareA(null); setCompareB(null); }}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, background: dark, border: `1px solid ${accent}50`, fontSize: 15, fontWeight: 700, color: accent, cursor: 'pointer', transition: 'background 0.15s' }}>
                        {label} Wins
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══════════ FULLSCREEN PREVIEW ═══════════ */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,11,15,0.95)', backdropFilter: 'blur(12px)' }}
            onClick={() => setSelectedImage(null)}>
            <button style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
              <X size={18} />
            </button>
            <motion.img src={selectedImage} alt="Preview" layoutId="preview-img"
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 16, boxShadow: '0 0 80px rgba(108,92,231,0.2)' }}
              referrerPolicy="no-referrer"
              onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {showExportMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 45 }} onClick={() => setShowExportMenu(false)} />}
    </div>
  );
}
