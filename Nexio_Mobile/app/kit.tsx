import React, { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import {
  ArrowLeft, Edit2, Download, Image as ImageIcon,
  FileText, Hash as SocialIcon, Archive, Globe, Tag, ShoppingBag,
  Hash, Music, Copy, Check, X, Plus, Save, Share2, RefreshCw, Zap, Heart,
} from 'lucide-react-native';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  ActivityIndicator, Dimensions, Alert, Modal, Share, Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdStore } from '../src/store/adStore';
import { cacheProductImage, generateAdImage, generateStyleImages } from '../src/services/aiService';
import { exportProductKit, type ExportPlatform } from '../src/services/exportService';
import type { ListingResult } from '../src/services/listingService';
import { getPresetsForCategory, type StylePreset } from '../src/stylePresets';
import { trackEvent, getRecommendations, type IntelligenceResult } from '../src/services/analyticsService';

const BG      = '#0B0B0F';
const CARD    = '#131320';
const BORDER  = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1   = '#FFFFFF';
const TEXT2   = '#8B8BA7';
const TEXT3   = '#3A3A52';

// ─── Shared components ────────────────────────────────────────────────────────

function CopyBtn({ text, small = false, onCopy }: { text: string; small?: boolean; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  async function handle() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <TouchableOpacity onPress={handle} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: copied ? 'rgba(52,211,153,0.1)' : '#1E1E2E' }} activeOpacity={0.7}>
      {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} color={TEXT3} />}
      {!small && <Text style={{ color: copied ? '#34d399' : TEXT3, fontSize: 11, fontWeight: '600' }}>{copied ? 'Copied' : 'Copy'}</Text>}
    </TouchableOpacity>
  );
}

function ContentCard({ label, copyText, children, onCopy }: { label: string; copyText: string; children: React.ReactNode; onCopy?: () => void }) {
  return (
    <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</Text>
        <CopyBtn text={copyText} onCopy={onCopy} />
      </View>
      {children}
    </View>
  );
}

function EditableText({ value, onChange, bold = false }: { value: string; onChange: (v: string) => void; bold?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <TextInput multiline autoFocus value={draft} onChangeText={setDraft}
        onBlur={() => { onChange(draft); setEditing(false); }}
        style={{ color: bold ? TEXT1 : TEXT2, fontSize: bold ? 14 : 13, fontWeight: bold ? '600' : '400', lineHeight: bold ? 22 : 21, borderBottomWidth: 1, borderBottomColor: 'rgba(92,59,229,0.5)', paddingBottom: 4 }} />
    );
  }
  return (
    <TouchableOpacity onPress={() => { setDraft(value); setEditing(true); }} activeOpacity={0.7}>
      <Text style={{ color: bold ? TEXT1 : TEXT2, fontSize: bold ? 14 : 13, fontWeight: bold ? '600' : '400', lineHeight: bold ? 22 : 21 }}>{value}</Text>
    </TouchableOpacity>
  );
}

function EditableTags({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const safeItems = Array.isArray(items) ? items : [];
  function add() { const t = newTag.trim(); if (t) onChange([...safeItems, t]); setNewTag(''); setAdding(false); }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {safeItems.map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E1E2E', borderRadius: 20, paddingLeft: 10, paddingRight: 6, paddingVertical: 4 }}>
          <Text style={{ color: TEXT2, fontSize: 12 }}>{t}</Text>
          <TouchableOpacity onPress={() => onChange(safeItems.filter((_, j) => j !== i))} hitSlop={6}><X size={10} color={TEXT3} /></TouchableOpacity>
        </View>
      ))}
      {adding
        ? <TextInput autoFocus value={newTag} onChangeText={setNewTag} onBlur={add} onSubmitEditing={add} returnKeyType="done"
            placeholder="Add…" placeholderTextColor={TEXT3}
            style={{ backgroundColor: '#1E1E2E', borderRadius: 20, borderWidth: 1, borderColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 4, color: TEXT1, fontSize: 12, minWidth: 70 }} />
        : <TouchableOpacity onPress={() => setAdding(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', paddingHorizontal: 10, paddingVertical: 4 }} activeOpacity={0.7}>
            <Plus size={10} color={TEXT3} />
            <Text style={{ color: TEXT3, fontSize: 12 }}>Add</Text>
          </TouchableOpacity>
      }
    </View>
  );
}

// ─── Platform tabs ────────────────────────────────────────────────────────────

const LISTING_PLATFORMS = [
  { id: 'global', label: 'Global', Icon: Globe },
  { id: 'etsy', label: 'Etsy', Icon: Tag },
  { id: 'amazon', label: 'Amazon', Icon: ShoppingBag },
  { id: 'instagram', label: 'Instagram', Icon: Hash },
  { id: 'tiktok', label: 'TikTok', Icon: Music },
] as const;
type PlatformId = typeof LISTING_PLATFORMS[number]['id'];

// ─── Tab: Listing ─────────────────────────────────────────────────────────────

function ListingTab({ listing, setListing, category }: { listing: ListingResult; setListing: (v: ListingResult) => void; category: string }) {
  const [platform, setPlatform] = useState<PlatformId>('global');
  const trackCopy = () => trackEvent({ category, event_type: 'copy_listing', platform });
  const { global: g, etsy, amazon, instagram, tiktok } = listing;

  const patchGlobal    = (p: any) => setListing({ ...listing, global: { ...g, ...p } });
  const patchEtsy      = (p: any) => setListing({ ...listing, etsy: { ...etsy, ...p } });
  const patchEtsyDesc  = (p: any) => setListing({ ...listing, etsy: { ...etsy, description: { ...etsy.description, ...p } } });
  const patchAmazon    = (p: any) => setListing({ ...listing, amazon: { ...amazon, ...p } });
  const patchSocialIcon = (p: any) => setListing({ ...listing, instagram: { ...instagram, ...p } });
  const patchTiktok    = (p: any) => setListing({ ...listing, tiktok: { ...tiktok, ...p } });

  function copyAll() {
    switch (platform) {
      case 'global':    return [g.title, g.short_description, g.long_description, (g.keywords ?? []).join(', ')].join('\n\n');
      case 'etsy':      return [etsy.title, (etsy.tags ?? []).join(', '), ...Object.values(etsy.description ?? {}).filter(Boolean)].join('\n\n');
      case 'amazon':    return [amazon.title, (amazon.bullets ?? []).join('\n'), amazon.description, (amazon.backend_keywords ?? []).join(', ')].join('\n\n');
      case 'instagram': return [instagram.caption, (instagram.hashtags ?? []).join(' ')].join('\n\n');
      case 'tiktok':    return [tiktok.hook, tiktok.caption, (tiktok.hashtags ?? []).join(' ')].join('\n\n');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Platform switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {LISTING_PLATFORMS.map(({ id, label, Icon }) => (
          <TouchableOpacity key={id} onPress={() => setPlatform(id)} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: platform === id ? PRIMARY : CARD, borderWidth: 1, borderColor: platform === id ? PRIMARY : BORDER }}>
            <Icon size={12} color={platform === id ? '#fff' : TEXT3} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: platform === id ? '#fff' : TEXT2 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {platform === 'global' && (<>
          <ContentCard label="Title" copyText={g.title} onCopy={trackCopy}><EditableText bold value={g.title} onChange={v => patchGlobal({ title: v })} /></ContentCard>
          <ContentCard label="Short Description" copyText={g.short_description} onCopy={trackCopy}><EditableText value={g.short_description} onChange={v => patchGlobal({ short_description: v })} /></ContentCard>
          <ContentCard label="Long Description" copyText={g.long_description} onCopy={trackCopy}><EditableText value={g.long_description} onChange={v => patchGlobal({ long_description: v })} /></ContentCard>
          <ContentCard label="Keywords" copyText={(g.keywords ?? []).join(', ')} onCopy={trackCopy}><EditableTags items={g.keywords ?? []} onChange={v => patchGlobal({ keywords: v })} /></ContentCard>
        </>)}
        {platform === 'etsy' && (<>
          <ContentCard label="Title" copyText={etsy.title} onCopy={trackCopy}><EditableText bold value={etsy.title} onChange={v => patchEtsy({ title: v })} /></ContentCard>
          <ContentCard label="Tags" copyText={(etsy.tags ?? []).join(', ')} onCopy={trackCopy}><EditableTags items={etsy.tags ?? []} onChange={v => patchEtsy({ tags: v })} /></ContentCard>
          {(Object.entries(etsy.description) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
            <ContentCard key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} copyText={v} onCopy={trackCopy}><EditableText value={v} onChange={nv => patchEtsyDesc({ [k]: nv })} /></ContentCard>
          ))}
        </>)}
        {platform === 'amazon' && (<>
          <ContentCard label="Title" copyText={amazon.title} onCopy={trackCopy}><EditableText bold value={amazon.title} onChange={v => patchAmazon({ title: v })} /></ContentCard>
          <ContentCard label="Bullet Points" copyText={(amazon.bullets ?? []).join('\n')} onCopy={trackCopy}>
            {(amazon.bullets ?? []).map((b, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 14 }}>•</Text>
                <View style={{ flex: 1 }}><EditableText value={b} onChange={v => patchAmazon({ bullets: (amazon.bullets ?? []).map((x, j) => j === i ? v : x) })} /></View>
              </View>
            ))}
          </ContentCard>
          <ContentCard label="Description" copyText={amazon.description} onCopy={trackCopy}><EditableText value={amazon.description} onChange={v => patchAmazon({ description: v })} /></ContentCard>
          <ContentCard label="Backend Keywords" copyText={(amazon.backend_keywords ?? []).join(', ')} onCopy={trackCopy}><EditableTags items={amazon.backend_keywords ?? []} onChange={v => patchAmazon({ backend_keywords: v })} /></ContentCard>
        </>)}
        {platform === 'instagram' && (<>
          <ContentCard label="Caption" copyText={instagram.caption} onCopy={trackCopy}><EditableText value={instagram.caption} onChange={v => patchSocialIcon({ caption: v })} /></ContentCard>
          <ContentCard label="Hashtags" copyText={(instagram.hashtags ?? []).join(' ')} onCopy={trackCopy}><EditableTags items={instagram.hashtags ?? []} onChange={v => patchSocialIcon({ hashtags: v })} /></ContentCard>
        </>)}
        {platform === 'tiktok' && (<>
          <ContentCard label="Hook" copyText={tiktok.hook} onCopy={trackCopy}><EditableText bold value={tiktok.hook} onChange={v => patchTiktok({ hook: v })} /></ContentCard>
          <ContentCard label="Caption" copyText={tiktok.caption} onCopy={trackCopy}><EditableText value={tiktok.caption} onChange={v => patchTiktok({ caption: v })} /></ContentCard>
          <ContentCard label="Hashtags" copyText={(tiktok.hashtags ?? []).join(' ')} onCopy={trackCopy}><EditableTags items={tiktok.hashtags ?? []} onChange={v => patchTiktok({ hashtags: v })} /></ContentCard>
        </>)}
      </ScrollView>

      {/* Bottom bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: BG, borderTopWidth: 1, borderColor: BORDER }}>
        <TouchableOpacity onPress={() => { Clipboard.setStringAsync(copyAll()); trackCopy(); }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER }}
          activeOpacity={0.8}>
          <Copy size={15} color={TEXT2} />
          <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 13 }}>Copy All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/create')}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: PRIMARY }}
          activeOpacity={0.8}>
          <Edit2 size={15} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Regenerate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Mock placeholder images (shown when no real generation exists) ───────────

const MOCK_IMAGE_SLOTS = [
  { label: 'Main Shot',  seed: 'main' },
  { label: 'Lifestyle',  seed: 'life' },
  { label: 'Handheld',   seed: 'hand' },
  { label: 'Macro',      seed: 'macro' },
  { label: 'Studio',     seed: 'studio' },
  { label: 'Scene',      seed: 'scene' },
];

// ─── Full-screen Ad Preview Modal ────────────────────────────────────────────

type PreviewSlot = { id: string; label: string; imageUrl?: string; type?: string };

function AdPreviewModal({
  slot, listing, onClose,
}: { slot: PreviewSlot | null; listing: ListingResult | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const [saving, setSaving] = useState(false);
  const { selectedCategory } = useAdStore();

  if (!slot?.imageUrl) return null;

  const title    = listing?.global?.title          ?? slot.label;
  const subtitle = listing?.global?.short_description ?? '';

  async function handleSave() {
    setSaving(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to save this image.');
      setSaving(false);
      return;
    }
    try {
      const b64     = slot.imageUrl!.replace(/^data:image\/\w+;base64,/, '');
      const fileUri = `${FileSystem.cacheDirectory}adgenius_prev_${slot.id}.png`;
      await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });
      await MediaLibrary.saveToLibraryAsync(fileUri);
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      Alert.alert('Saved!', 'Image saved to your photo library.');
    } catch {
      Alert.alert('Error', 'Could not save image.');
    }
    setSaving(false);
  }

  async function handleShare() {
    trackEvent({ category: selectedCategory, event_type: 'download_image', variant_id: slot.id, style: slot.type });
    try {
      const b64     = slot.imageUrl!.replace(/^data:image\/\w+;base64,/, '');
      const fileUri = `${FileSystem.cacheDirectory}adgenius_shr_${slot.id}.png`;
      await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });

      const hashtags = listing?.instagram?.hashtags?.join(' ') ?? '';
      const parts: string[] = [];
      if (title)    parts.push(title);
      if (subtitle) parts.push(subtitle);
      if (hashtags) parts.push(hashtags);
      const message = parts.join('\n\n');

      if (Platform.OS === 'ios') {
        await Share.share({ title, message, url: fileUri });
      } else {
        await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: slot.label });
      }
    } catch {
      Alert.alert('Error', 'Could not share image.');
    }
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Full-bleed image */}
        <Image source={{ uri: slot.imageUrl }} style={{ position: 'absolute', width, height }} resizeMode="contain" />

        {/* Top action bar */}
        <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ backgroundColor: 'rgba(92,59,229,0.88)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{slot.label}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Download size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom ad overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.96)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 100, paddingBottom: insets.bottom + 36, paddingHorizontal: 24 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>
            Featured Product
          </Text>
          <Text style={{ color: '#fff', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.5, marginBottom: 10 }} numberOfLines={2}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 21, marginBottom: 28 }} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity activeOpacity={0.85}
              style={{ backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 30, paddingVertical: 15 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>Shop Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 20, paddingVertical: 15 }}>
              <Share2 size={15} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Share</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Tab: Images ──────────────────────────────────────────────────────────────

function ImagesTab({ variations, category }: { variations: any[]; category: string }) {
  const {
    pickedImage, updateVariation, listingResult,
    productAnalysis, styleImages, addStyleImageSet, updateStyleImageSet,
  } = useAdStore();
  const { width } = Dimensions.get('window');
  const cardW = (width - 48) / 2;
  const [downloading, setDownloading] = useState(false);
  const [previewSlot, setPreviewSlot] = useState<PreviewSlot | null>(null);
  const [generatingPreset, setGeneratingPreset] = useState<string | null>(null);

  const categoryPresets = getPresetsForCategory(category);
  const [insights, setInsights] = useState<IntelligenceResult | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Sort presets — recommended ones first
  const sortedPresets = [...categoryPresets].sort((a, b) => {
    if (!insights) return 0;
    const rank = (name: string) => {
      const idx = insights.top_recommendations.findIndex(
        r => r.style.toLowerCase().includes(name.toLowerCase()) ||
             name.toLowerCase().includes(r.style.toLowerCase().split(' ')[0])
      );
      return idx === -1 ? 999 : idx;
    };
    return rank(a.name) - rank(b.name);
  });

  useEffect(() => {
    getRecommendations(category).then(r => { if (r?.top_recommendations.length) setInsights(r); }).catch(() => {});
  }, [category]);

  async function handleGenerateStyle(preset: StylePreset) {
    if (!pickedImage || generatingPreset) return;
    setGeneratingPreset(preset.id);

    const existing = styleImages.find(s => s.presetId === preset.id);
    if (existing) {
      updateStyleImageSet(preset.id, { status: 'generating', imageUrls: [] });
    } else {
      addStyleImageSet({ presetId: preset.id, presetName: preset.name, status: 'generating', imageUrls: [] });
    }

    trackEvent({ category, event_type: 'select_style', style: preset.name });
    try {
      const sessionId = await cacheProductImage(pickedImage.base64, pickedImage.mimeType);
      const analysis = productAnalysis ?? {
        product_type: 'product', color: '', material: '', style: '',
        media_type: 'photo' as const, target: '', positioning: '', visual_direction: '',
      };
      const [url1, url2] = await generateStyleImages(sessionId, preset, analysis);
      updateStyleImageSet(preset.id, { status: 'done', imageUrls: [url1, url2] });
    } catch (e) {
      console.error('[kit] style generation failed:', e);
      updateStyleImageSet(preset.id, { status: 'error' });
    } finally {
      setGeneratingPreset(null);
    }
  }

  const hasReal = variations.some(v => v.imageUrl || v.status === 'generating' || v.status === 'completed');

  const slots = hasReal
    ? variations.map((v, i) => ({
        id: v.id,
        label: v.label ?? MOCK_IMAGE_SLOTS[i]?.label ?? `Shot ${i + 1}`,
        prompt: v.prompt,
        imageUrl: v.imageUrl,
        status: v.status,
        type: v.type,
      }))
    : MOCK_IMAGE_SLOTS.map(s => ({
        id: s.seed,
        label: s.label,
        prompt: '',
        imageUrl: `https://picsum.photos/seed/${category}-${s.seed}/400/400`,
        status: 'completed',
      }));

  async function retrySlot(slot: typeof slots[0]) {
    if (!pickedImage || !slot.prompt) return;
    trackEvent({ category, event_type: 'regenerate_variant', variant_id: slot.id, style: slot.label });
    updateVariation(slot.id, { status: 'generating', imageUrl: undefined });
    try {
      const sessionId = await cacheProductImage(pickedImage.base64, pickedImage.mimeType);
      const imageUrl = await generateAdImage(sessionId, slot.prompt);
      updateVariation(slot.id, { status: 'completed', imageUrl });
    } catch (e) {
      console.error('[kit] retry failed:', e);
      updateVariation(slot.id, { status: 'error' });
    }
  }

  async function downloadAll() {
    const ready = slots.filter(s => s.imageUrl?.startsWith('data:'));
    if (ready.length === 0) {
      Alert.alert('No images ready', 'Wait for images to finish generating.');
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to save images.');
      return;
    }
    setDownloading(true);
    let saved = 0;
    for (const slot of ready) {
      try {
        const base64 = slot.imageUrl!.replace(/^data:image\/\w+;base64,/, '');
        const fileUri = `${FileSystem.cacheDirectory}adgenius_${slot.id}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        await MediaLibrary.saveToLibraryAsync(fileUri);
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        trackEvent({ category, event_type: 'download_image', variant_id: slot.id, style: slot.label });
        saved++;
      } catch (e) {
        console.error('[downloadAll] failed for', slot.label, e);
      }
    }
    setDownloading(false);
    Alert.alert('Saved!', `${saved} of ${ready.length} image${ready.length !== 1 ? 's' : ''} saved to your photo library.`);
  }

  const slotA = compareA ? slots.find(s => s.id === compareA) : null;
  const slotB = compareB ? slots.find(s => s.id === compareB) : null;

  return (
    <View style={{ flex: 1 }}>
      {previewSlot && (
        <AdPreviewModal slot={previewSlot} listing={listingResult} onClose={() => setPreviewSlot(null)} />
      )}

      {/* ── A/B Compare Modal ──────────────────────────────────────────────── */}
      <Modal visible={showCompare && !!slotA?.imageUrl && !!slotB?.imageUrl} transparent animationType="slide" onRequestClose={() => setShowCompare(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14 }}>
            <Text style={{ color: TEXT1, fontSize: 16, fontWeight: '800' }}>A/B Compare</Text>
            <TouchableOpacity onPress={() => setShowCompare(false)} activeOpacity={0.7}>
              <X size={22} color={TEXT2} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
              {slotA?.imageUrl && <Image source={{ uri: slotA.imageUrl }} style={{ flex: 1 }} resizeMode="cover" />}
              <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(251,191,36,0.92)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>A</Text>
              </View>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.65)' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{slotA?.label}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              {slotB?.imageUrl && <Image source={{ uri: slotB.imageUrl }} style={{ flex: 1 }} resizeMode="cover" />}
              <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(96,165,250,0.92)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>B</Text>
              </View>
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.65)' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{slotB?.label}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 44 }}>
            <TouchableOpacity
              onPress={() => {
                if (slotA) trackEvent({ category, event_type: 'favorite_variant', variant_id: slotA.id, style: slotA.label });
                setCompareA(null); setCompareB(null); setShowCompare(false);
              }}
              style={{ flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', alignItems: 'center' }}
              activeOpacity={0.8}>
              <Text style={{ color: '#fbbf24', fontWeight: '800', fontSize: 14 }}>A Wins</Text>
              <Text style={{ color: TEXT2, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{slotA?.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (slotB) trackEvent({ category, event_type: 'favorite_variant', variant_id: slotB.id, style: slotB.label });
                setCompareA(null); setCompareB(null); setShowCompare(false);
              }}
              style={{ flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)', alignItems: 'center' }}
              activeOpacity={0.8}>
              <Text style={{ color: '#60a5fa', fontWeight: '800', fontSize: 14 }}>B Wins</Text>
              <Text style={{ color: TEXT2, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{slotB?.label}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {slots.map((slot, i) => {
            const matchedRec = insights?.top_recommendations.find(
              r => r.style.toLowerCase().includes(slot.label.toLowerCase()) ||
                   slot.label.toLowerCase().includes(r.style.toLowerCase().split(' ')[0])
            ) ?? null;
            const isBest = !!insights?.best_variant && (
              insights.best_variant.style.toLowerCase().includes(slot.label.toLowerCase()) ||
              slot.label.toLowerCase().includes(insights.best_variant.style.toLowerCase().split(' ')[0])
            );
            const isFav = favorites.has(slot.id);
            const isInCompare = slot.id === compareA || slot.id === compareB;
            return (
            <View key={i} style={{ width: cardW, borderRadius: 16, overflow: 'hidden', backgroundColor: CARD, borderWidth: 1, borderColor: isFav ? '#ef4444' : isInCompare ? PRIMARY : BORDER }}>
              {/* Image area */}
              <TouchableOpacity
                activeOpacity={slot.imageUrl ? 0.85 : 1}
                onPress={() => {
                  if (!slot.imageUrl) return;
                  trackEvent({ category, event_type: 'view_variant', variant_id: slot.id, style: slot.label });
                  setPreviewSlot(slot);
                }}
                style={{ width: cardW, height: cardW, backgroundColor: '#1A1A2E' }}
              >
                {slot.status === 'generating' ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ActivityIndicator color={PRIMARY} />
                    <Text style={{ color: TEXT3, fontSize: 11 }}>Generating…</Text>
                  </View>
                ) : slot.status === 'error' ? (
                  <TouchableOpacity onPress={() => retrySlot(slot)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }} activeOpacity={0.7}>
                    <RefreshCw size={20} color="#f87171" />
                    <Text style={{ color: '#f87171', fontSize: 11 }}>Failed — Tap to retry</Text>
                  </TouchableOpacity>
                ) : slot.imageUrl ? (
                  <>
                    <Image source={{ uri: slot.imageUrl }} style={{ width: cardW, height: cardW }} resizeMode="cover" />
                    {matchedRec && (
                      <View style={{
                        position: 'absolute', top: 6, left: 6,
                        backgroundColor: matchedRec.confidence === 'High' ? 'rgba(52,211,153,0.9)' : matchedRec.confidence === 'Medium' ? 'rgba(251,191,36,0.9)' : 'rgba(100,100,140,0.85)',
                        borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{matchedRec.conversion_score.toFixed(1)} ★</Text>
                      </View>
                    )}
                    {isBest && (
                      <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(92,59,229,0.92)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>★ BEST</Text>
                      </View>
                    )}
                    <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(92,59,229,0.85)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>TAP TO PREVIEW</Text>
                    </View>
                  </>
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={28} color={TEXT3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Card footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ color: TEXT2, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>{slot.label}</Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {/* Heart / Favorite */}
                  <TouchableOpacity
                    onPress={() => {
                      if (!slot.imageUrl) return;
                      const next = new Set(favorites);
                      if (isFav) { next.delete(slot.id); }
                      else {
                        next.add(slot.id);
                        trackEvent({ category, event_type: 'favorite_variant', variant_id: slot.id, style: slot.label });
                      }
                      setFavorites(next);
                    }}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isFav ? 'rgba(239,68,68,0.12)' : '#1A1A2E', alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}>
                    <Heart size={13} color={isFav ? '#ef4444' : TEXT3} fill={isFav ? '#ef4444' : 'none'} />
                  </TouchableOpacity>
                  {/* Save */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (!slot.imageUrl) return;
                      const { status } = await MediaLibrary.requestPermissionsAsync();
                      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
                      const b64 = slot.imageUrl.replace(/^data:image\/\w+;base64,/, '');
                      const uri = `${FileSystem.cacheDirectory}adgenius_s_${slot.id}.png`;
                      await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
                      await MediaLibrary.saveToLibraryAsync(uri);
                      await FileSystem.deleteAsync(uri, { idempotent: true });
                      trackEvent({ category, event_type: 'download_image', variant_id: slot.id, style: slot.label });
                      Alert.alert('Saved!', 'Image saved to your photo library.');
                    }}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
                    <Save size={13} color={TEXT3} />
                  </TouchableOpacity>
                  {/* Share */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (!slot.imageUrl) return;
                      const b64 = slot.imageUrl.replace(/^data:image\/\w+;base64,/, '');
                      const uri = `${FileSystem.cacheDirectory}adgenius_sh_${slot.id}.png`;
                      await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
                      const cardTitle    = listingResult?.global?.title ?? slot.label;
                      const cardSubtitle = listingResult?.global?.short_description ?? '';
                      const cardTags     = listingResult?.instagram?.hashtags?.join(' ') ?? '';
                      const cardParts: string[] = [];
                      if (cardTitle)    cardParts.push(cardTitle);
                      if (cardSubtitle) cardParts.push(cardSubtitle);
                      if (cardTags)     cardParts.push(cardTags);
                      const cardMessage = cardParts.join('\n\n');
                      if (Platform.OS === 'ios') {
                        await Share.share({ title: cardTitle, message: cardMessage, url: uri });
                      } else {
                        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
                      }
                    }}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
                    <Share2 size={13} color={TEXT3} />
                  </TouchableOpacity>
                  {/* A/B Compare */}
                  <TouchableOpacity
                    onPress={() => {
                      if (!slot.imageUrl) return;
                      if (!compareA || compareA === slot.id) {
                        setCompareA(slot.id === compareA ? null : slot.id);
                      } else if (!compareB || compareB === slot.id) {
                        const newB = compareB === slot.id ? null : slot.id;
                        setCompareB(newB);
                        if (newB) setShowCompare(true);
                      } else {
                        setCompareA(slot.id);
                        setCompareB(null);
                      }
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: isInCompare ? 'rgba(92,59,229,0.18)' : '#1A1A2E',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: isInCompare ? 1 : 0, borderColor: PRIMARY,
                    }} activeOpacity={0.7}>
                    <Text style={{ color: slot.id === compareA ? '#fbbf24' : slot.id === compareB ? '#60a5fa' : TEXT3, fontSize: 8, fontWeight: '800' }}>A/B</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            );
          })}
        </View>

        {/* ── Style Variations (generated results) ─────────────────────────── */}
        {styleImages.filter(s => s.status === 'done' && s.imageUrls.length > 0).length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={{ color: TEXT1, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4, paddingHorizontal: 0 }}>Style Variations</Text>
            <Text style={{ color: TEXT2, fontSize: 12, marginBottom: 16 }}>Your generated style previews</Text>
            {styleImages.filter(s => s.status === 'done').map(set => (
              <View key={set.presetId} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ backgroundColor: 'rgba(92,59,229,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '700' }}>{set.presetName}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {set.imageUrls.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      onPress={() => setPreviewSlot({ id: `${set.presetId}_${idx}`, label: `${set.presetName} ${idx + 1}`, imageUrl: url })}
                      style={{ flex: 1, aspectRatio: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: BORDER }}
                    >
                      <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(92,59,229,0.85)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>TAP TO PREVIEW</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Intelligence Insights ────────────────────────────────────────── */}
        {insights && insights.top_recommendations.length > 0 && (
          <View style={{ marginTop: 24, backgroundColor: '#131320', borderRadius: 16, borderWidth: 1, borderColor: '#1A1A28', padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: PRIMARY, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>🔥 Top Styles · {category}</Text>
            </View>
            {insights.top_recommendations.slice(0, 3).map((rec, i) => (
              <View key={rec.style} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 2 ? 10 : 0 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT1, fontSize: 12, fontWeight: '700' }}>{rec.style}</Text>
                  <Text style={{ color: TEXT2, fontSize: 11, marginTop: 1 }} numberOfLines={1}>{rec.reason}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10 }}>
                  <View style={{
                    backgroundColor: rec.confidence === 'High' ? 'rgba(52,211,153,0.15)' : rec.confidence === 'Medium' ? 'rgba(251,191,36,0.15)' : 'rgba(100,100,120,0.2)',
                    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: rec.confidence === 'High' ? '#34d399' : rec.confidence === 'Medium' ? '#fbbf24' : TEXT2 }}>
                      {rec.confidence.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '700' }}>{rec.conversion_score.toFixed(1)}</Text>
                </View>
              </View>
            ))}
            {insights.best_variant && (
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#1A1A28', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(92,59,229,0.18)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 1 }}>
                  <Text style={{ color: PRIMARY, fontSize: 9, fontWeight: '800' }}>★ BEST</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT1, fontSize: 12, fontWeight: '700' }}>{insights.best_variant.style}</Text>
                  <Text style={{ color: TEXT2, fontSize: 11, marginTop: 2, lineHeight: 15 }} numberOfLines={2}>{insights.best_variant.reason}</Text>
                </View>
              </View>
            )}
            {insights.insights.length > 0 && (
              <Text style={{ color: TEXT3, fontSize: 11, marginTop: 10, lineHeight: 16 }}>💡 {insights.insights[0]}</Text>
            )}
          </View>
        )}

        {/* ── Try More Styles ──────────────────────────────────────────────── */}
        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={16} color={PRIMARY} />
            <Text style={{ color: TEXT1, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>Try More Styles</Text>
          </View>
          <Text style={{ color: TEXT2, fontSize: 12, marginBottom: 16 }}>Add creative variations · 1 credit each · 2 images per style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {sortedPresets.map(preset => {
              const styleSet = styleImages.find(s => s.presetId === preset.id);
              const isGenerating = styleSet?.status === 'generating';
              const isDone       = styleSet?.status === 'done';
              const isError      = styleSet?.status === 'error';
              const isActive     = generatingPreset === preset.id;

              return (
                <View key={preset.id} style={{
                  width: 150, borderRadius: 18, backgroundColor: CARD,
                  borderWidth: 1.5, borderColor: isDone ? 'rgba(52,211,153,0.4)' : isActive ? PRIMARY : BORDER,
                  overflow: 'hidden',
                }}>
                  {/* Preview strip */}
                  <View style={{
                    height: 72, backgroundColor: isDone ? 'rgba(52,211,153,0.07)' : 'rgba(92,59,229,0.08)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 32 }}>{preset.preview}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: TEXT1, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{preset.name}</Text>
                      <View style={{ backgroundColor: isDone ? 'rgba(52,211,153,0.15)' : '#1E1E2E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: isDone ? '#34d399' : TEXT3, fontSize: 9, fontWeight: '700' }}>{isDone ? '✓ Done' : '1 credit'}</Text>
                      </View>
                    </View>
                    <Text style={{ color: TEXT2, fontSize: 11, lineHeight: 16, marginBottom: 10 }} numberOfLines={2}>{preset.description}</Text>
                    <TouchableOpacity
                      onPress={() => handleGenerateStyle(preset)}
                      disabled={!!generatingPreset}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                        paddingVertical: 9, borderRadius: 10,
                        backgroundColor: isDone ? 'rgba(52,211,153,0.12)' : isError ? 'rgba(248,113,113,0.12)' : 'rgba(92,59,229,0.15)',
                        opacity: generatingPreset && !isActive ? 0.45 : 1,
                      }}>
                      {isActive
                        ? <ActivityIndicator size="small" color={PRIMARY} />
                        : isDone
                          ? <Check size={12} color="#34d399" />
                          : isError
                            ? <RefreshCw size={12} color="#f87171" />
                            : <Zap size={12} color={PRIMARY} />}
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: isDone ? '#34d399' : isError ? '#f87171' : PRIMARY,
                      }}>
                        {isActive ? 'Generating…' : isDone ? 'Regenerate' : isError ? 'Retry' : 'Generate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: BG, borderTopWidth: 1, borderColor: BORDER }}>
        <TouchableOpacity onPress={() => { trackEvent({ category, event_type: 'regenerate_variant' }); router.push('/create'); }}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER }}
          activeOpacity={0.8}>
          <RefreshCw size={15} color={TEXT2} />
          <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 13 }}>Regenerate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={downloadAll}
          disabled={downloading}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: PRIMARY, opacity: downloading ? 0.6 : 1 }}
          activeOpacity={0.8}>
          {downloading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Download size={15} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{downloading ? 'Saving…' : 'Download All'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tab: Social ──────────────────────────────────────────────────────────────

function SocialTab({ listing, category }: { listing: ListingResult; category: string }) {
  const { instagram, tiktok } = listing;
  const trackCopy = () => trackEvent({ category, event_type: 'copy_listing', platform: 'social' });
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Instagram</Text>
      <ContentCard label="Caption" copyText={instagram.caption} onCopy={trackCopy}>
        <Text style={{ color: TEXT2, fontSize: 13, lineHeight: 21 }}>{instagram.caption}</Text>
      </ContentCard>
      <ContentCard label="Hashtags" copyText={instagram.hashtags.join(' ')} onCopy={trackCopy}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {instagram.hashtags.map((h, i) => (
            <View key={i} style={{ backgroundColor: '#1E1E2E', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#818cf8', fontSize: 12 }}>{h}</Text>
            </View>
          ))}
        </View>
      </ContentCard>
      <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8, marginBottom: 12 }}>TikTok</Text>
      <ContentCard label="Hook" copyText={tiktok.hook} onCopy={trackCopy}>
        <Text style={{ color: TEXT1, fontSize: 14, fontWeight: '600', lineHeight: 22 }}>{tiktok.hook}</Text>
      </ContentCard>
      <ContentCard label="Caption" copyText={tiktok.caption} onCopy={trackCopy}>
        <Text style={{ color: TEXT2, fontSize: 13, lineHeight: 21 }}>{tiktok.caption}</Text>
      </ContentCard>
      <ContentCard label="Hashtags" copyText={tiktok.hashtags.join(' ')} onCopy={trackCopy}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tiktok.hashtags.map((h, i) => (
            <View key={i} style={{ backgroundColor: '#1E1E2E', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#22d3ee', fontSize: 12 }}>{h}</Text>
            </View>
          ))}
        </View>
      </ContentCard>
    </ScrollView>
  );
}

// ─── Tab: Export ──────────────────────────────────────────────────────────────

const EXPORT_OPTIONS: { platform: ExportPlatform; label: string; desc: string; Icon: any; color: string }[] = [
  { platform: 'full',      label: 'Download Full Kit (ZIP)', desc: 'Images, listings, social content & more', Icon: Archive,     color: PRIMARY },
  { platform: 'amazon',    label: 'Export for Amazon',       desc: 'Optimized images + listing files',       Icon: ShoppingBag, color: '#f59e0b' },
  { platform: 'etsy',      label: 'Export for Etsy',         desc: 'Etsy listing files + image pack',        Icon: Tag,         color: '#f97316' },
  { platform: 'instagram', label: 'Export for Instagram',    desc: 'Captions + hashtags + images',           Icon: SocialIcon,  color: '#ec4899' },
];

function ExportTab({ variations, listing, category }: { variations: any[]; listing: ListingResult | null; category: string }) {
  const [loading, setLoading] = useState<ExportPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(platform: ExportPlatform) {
    if (!listing) { setError('Generate a listing first before exporting.'); return; }
    setError(null);
    setLoading(platform);
    try {
      await exportProductKit(variations, listing, platform);
      trackEvent({ category, event_type: 'export_zip', platform });
    } catch (e: any) {
      console.error('[export]', e);
      setError(e?.message ?? 'Export failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17, marginBottom: 4 }}>Export Your Product Kit</Text>
      <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 20 }}>Everything you need to sell across marketplaces and social platforms.</Text>

      {error && (
        <View style={{ backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', padding: 12, marginBottom: 16 }}>
          <Text style={{ color: '#f87171', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {!listing && (
        <View style={{ backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', padding: 12, marginBottom: 16 }}>
          <Text style={{ color: '#fbbf24', fontSize: 13 }}>Listing not yet generated — text files will be empty. Images will still be included.</Text>
        </View>
      )}

      {EXPORT_OPTIONS.map(({ platform, label, desc, Icon, color }) => {
        const isLoading = loading === platform;
        const disabled = !!loading;
        return (
          <TouchableOpacity
            key={platform}
            onPress={() => handleExport(platform)}
            activeOpacity={0.8}
            disabled={disabled}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 10, opacity: disabled && !isLoading ? 0.5 : 1 }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 14 }}>{label}</Text>
              <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{desc}</Text>
            </View>
            {isLoading
              ? <ActivityIndicator size="small" color={color} />
              : <Download size={18} color={TEXT3} />
            }
          </TouchableOpacity>
        );
      })}

      <Text style={{ color: TEXT3, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 17 }}>
        All exports include high-quality images{'\n'}and ready-to-use text files.
      </Text>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: 'images',  label: 'Images',  Icon: ImageIcon },
  { id: 'listing', label: 'Listing', Icon: FileText },
  { id: 'social',  label: 'Social',  Icon: SocialIcon },
  { id: 'export',  label: 'Export',  Icon: Archive },
] as const;
type MainTab = typeof MAIN_TABS[number]['id'];

export default function KitScreen() {
  const insets = useSafeAreaInsets();
  const { pickedImage, listingResult: storedListing, selectedCategory, variations, goal } = useAdStore();
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (goal === 'images') return 'images';
    if (goal === 'social') return 'social';
    return 'listing';
  });
  const [listing, setListing] = useState(storedListing);

  const productName = listing?.product_analysis?.product_type || 'Product Kit';
  const productCat  = listing?.product_analysis?.category || selectedCategory;

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={17} color={TEXT2} />
        </TouchableOpacity>

        {/* Product info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {pickedImage
            ? <Image source={{ uri: pickedImage.uri }} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CARD }} />
            : <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} color={TEXT3} /></View>
          }
          <View style={{ flex: 1 }}>
            <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{productName}</Text>
            <Text style={{ color: TEXT3, fontSize: 11, marginTop: 1 }}>{productCat}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/publish')}
          style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={15} color={TEXT2} />
        </TouchableOpacity>
      </View>

      {/* Sticky tab bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: BORDER }}>
        {MAIN_TABS.map(({ id, label, Icon }) => (
          <TouchableOpacity key={id} onPress={() => setActiveTab(id)} activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, borderBottomWidth: 2, borderBottomColor: activeTab === id ? PRIMARY : 'transparent' }}>
            <Icon size={16} color={activeTab === id ? PRIMARY : TEXT3} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: activeTab === id ? PRIMARY : TEXT3 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'images'  && <ImagesTab variations={variations ?? []} category={selectedCategory} />}
      {activeTab === 'listing' && listing && <ListingTab listing={listing} setListing={setListing} category={selectedCategory} />}
      {activeTab === 'listing' && !listing && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: TEXT2, fontSize: 14 }}>No listing generated yet.</Text>
        </View>
      )}
      {activeTab === 'social'  && listing && <SocialTab listing={listing} category={selectedCategory} />}
      {activeTab === 'social'  && !listing && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: TEXT2, fontSize: 14 }}>Generate a listing first.</Text>
        </View>
      )}
      {activeTab === 'export'  && <ExportTab variations={variations ?? []} listing={listing} category={selectedCategory} />}
    </View>
  );
}
