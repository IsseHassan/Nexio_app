import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Globe, Tag, ShoppingBag, Hash, Music,
  Copy, Check, Settings2, X, Plus,
} from 'lucide-react-native';
import { useAdStore } from '../src/store/adStore';
import {
  generateListing,
  type ListingResult,
  type Language,
  type Tone,
  type ListingLength,
} from '../src/services/listingService';

// ─── Copy button ─────────────────────────────────────────────────────────────

const BG_L      = '#EDE4DC';
const CARD_L    = '#F6F2EE';
const BORDER_L  = '#CFCBC7';
const PRIMARY_L = '#E8664A';
const TEXT1_L   = '#2B2B2B';
const TEXT2_L   = '#7A7A7A';
const TEXT3_L   = '#ADADAD';
const GREEN_L   = '#34C759';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handle() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <TouchableOpacity onPress={handle} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: copied ? 'rgba(52,199,89,0.1)' : '#F3EDE8' }} activeOpacity={0.7}>
      {copied ? <Check size={11} color={GREEN_L} /> : <Copy size={11} color={TEXT2_L} />}
      <Text style={{ color: copied ? GREEN_L : TEXT2_L, fontSize: 11, fontWeight: '600' }}>{copied ? 'Copied' : 'Copy'}</Text>
    </TouchableOpacity>
  );
}

// ─── Editable text ────────────────────────────────────────────────────────────

function EditableText({
  value, onChange, bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  bold?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <TextInput
        autoFocus
        multiline
        value={draft}
        onChangeText={setDraft}
        onBlur={() => { onChange(draft); setEditing(false); }}
        style={{ color: bold ? TEXT1_L : TEXT2_L, fontSize: bold ? 14 : 13, fontWeight: bold ? '600' : '400', lineHeight: bold ? 22 : 21, borderBottomWidth: 1, borderBottomColor: 'rgba(232,102,74,0.4)', paddingBottom: 4 }}
      />
    );
  }

  return (
    <TouchableOpacity onPress={() => { setDraft(value); setEditing(true); }} activeOpacity={0.7}>
      <Text style={{ color: bold ? TEXT1_L : TEXT2_L, fontSize: bold ? 14 : 13, fontWeight: bold ? '600' : '400', lineHeight: bold ? 22 : 21 }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Editable tags ────────────────────────────────────────────────────────────

function EditableTags({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  function addTag() {
    const tag = newTag.trim();
    if (tag) onChange([...items, tag]);
    setNewTag('');
    setAdding(false);
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BG_L, borderRadius: 20, paddingLeft: 10, paddingRight: 6, paddingVertical: 4, borderWidth: 1, borderColor: BORDER_L }}>
          <Text style={{ color: TEXT2_L, fontSize: 12 }}>{t}</Text>
          <TouchableOpacity onPress={() => onChange(items.filter((_, j) => j !== i))} hitSlop={6}>
            <X size={10} color={TEXT3_L} />
          </TouchableOpacity>
        </View>
      ))}
      {adding ? (
        <TextInput
          autoFocus value={newTag} onChangeText={setNewTag} onBlur={addTag} onSubmitEditing={addTag} returnKeyType="done"
          placeholder="Add tag…" placeholderTextColor={TEXT3_L}
          style={{ backgroundColor: BG_L, borderRadius: 20, borderWidth: 1, borderColor: PRIMARY_L, paddingHorizontal: 10, paddingVertical: 4, color: TEXT1_L, fontSize: 12, minWidth: 80 }}
        />
      ) : (
        <TouchableOpacity onPress={() => setAdding(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, borderWidth: 1, borderColor: BORDER_L, borderStyle: 'dashed', paddingHorizontal: 10, paddingVertical: 4 }}
          activeOpacity={0.7}>
          <Plus size={10} color={TEXT3_L} />
          <Text style={{ color: TEXT3_L, fontSize: 12 }}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Content card ─────────────────────────────────────────────────────────────

function Card({ label, copyText, children }: { label: string; copyText: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: CARD_L, borderWidth: 1, borderColor: BORDER_L, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: TEXT3_L, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <CopyBtn text={copyText} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(232,102,74,0.08)' }}>
            <Text style={{ color: PRIMARY_L, fontSize: 11, fontWeight: '600' }}>Edit</Text>
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}

// ─── Option pill row ─────────────────────────────────────────────────────────

function OptionRow<T extends string>({
  label, options, value, onChange,
}: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: TEXT2_L, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)}
            style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: value === opt ? PRIMARY_L : CARD_L, borderWidth: 1, borderColor: value === opt ? PRIMARY_L : BORDER_L }}
            activeOpacity={0.8}>
            <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'capitalize', color: value === opt ? '#fff' : TEXT2_L }}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Platforms ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'global',    label: 'Global',    Icon: Globe },
  { id: 'etsy',      label: 'Etsy',      Icon: Tag },
  { id: 'amazon',    label: 'Amazon',    Icon: ShoppingBag },
  { id: 'instagram', label: 'Instagram', Icon: Hash },
  { id: 'tiktok',    label: 'TikTok',    Icon: Music },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ListingScreen() {
  const {
    pickedImage, selectedCategory,
    listingResult: storedListing,
    listingLanguage, listingTone, listingLength,
    setListingResult,
  } = useAdStore();

  const insets = useSafeAreaInsets();

  const [language, setLanguage] = useState<Language>(listingLanguage);
  const [tone, setTone] = useState<Tone>(listingTone);
  const [length, setLength] = useState<ListingLength>(listingLength);

  const [listing, setListing] = useState<ListingResult | null>(storedListing ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlatform, setActivePlatform] = useState<PlatformId>('global');
  const [phase, setPhase] = useState<'config' | 'result'>(storedListing ? 'result' : 'config');

  const patchGlobal    = (p: Partial<ListingResult['global']>)    => setListing(prev => prev ? { ...prev, global: { ...prev.global, ...p } } : prev);
  const patchEtsy      = (p: Partial<ListingResult['etsy']>)      => setListing(prev => prev ? { ...prev, etsy: { ...prev.etsy, ...p } } : prev);
  const patchEtsyDesc  = (p: Partial<ListingResult['etsy']['description']>) => setListing(prev => prev ? { ...prev, etsy: { ...prev.etsy, description: { ...prev.etsy.description, ...p } } } : prev);
  const patchAmazon    = (p: Partial<ListingResult['amazon']>)    => setListing(prev => prev ? { ...prev, amazon: { ...prev.amazon, ...p } } : prev);
  const patchInstagram = (p: Partial<ListingResult['instagram']>) => setListing(prev => prev ? { ...prev, instagram: { ...prev.instagram, ...p } } : prev);
  const patchTiktok    = (p: Partial<ListingResult['tiktok']>)    => setListing(prev => prev ? { ...prev, tiktok: { ...prev.tiktok, ...p } } : prev);

  async function handleGenerate() {
    if (!pickedImage) return;
    setIsGenerating(true);
    try {
      const result = await generateListing({
        image: { base64: pickedImage.base64, mimeType: pickedImage.mimeType },
        category: selectedCategory,
        language, tone, length,
      });
      setListing(result);
      setListingResult(result);
      setPhase('result');
    } catch {
      // generation failed silently — user can retry
    }
    setIsGenerating(false);
  }

  function copyAllForPlatform(): string {
    if (!listing) return '';
    switch (activePlatform) {
      case 'global':    return [listing.global.title, listing.global.short_description, listing.global.long_description, listing.global.keywords.join(', ')].join('\n\n');
      case 'etsy':      return [listing.etsy.title, listing.etsy.tags.join(', '), ...Object.values(listing.etsy.description).filter(Boolean)].join('\n\n');
      case 'amazon':    return [listing.amazon.title, listing.amazon.bullets.join('\n'), listing.amazon.description, listing.amazon.backend_keywords.join(', ')].join('\n\n');
      case 'instagram': return [listing.instagram.caption, listing.instagram.hashtags.join(' ')].join('\n\n');
      case 'tiktok':    return [listing.tiktok.hook, listing.tiktok.caption, listing.tiktok.hashtags.join(' ')].join('\n\n');
    }
  }

  const pa = listing?.product_analysis;

  return (
    <View style={{ flex: 1, backgroundColor: BG_L, paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER_L, backgroundColor: CARD_L }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={18} color={TEXT2_L} />
          <Text style={{ color: TEXT2_L, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: TEXT1_L, fontWeight: '700', fontSize: 15 }}>Listing Generator</Text>
        {phase === 'result' ? (
          <TouchableOpacity onPress={() => setPhase('config')} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Settings2 size={15} color={PRIMARY_L} />
            <Text style={{ color: PRIMARY_L, fontSize: 13 }}>Settings</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Product analysis strip */}
      {phase === 'result' && pa && (
        <View style={{ borderBottomWidth: 1, borderColor: BORDER_L, paddingVertical: 10, backgroundColor: CARD_L }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 6, alignItems: 'center' }}>
            {(Object.entries(pa) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BG_L, borderWidth: 1, borderColor: BORDER_L, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: TEXT2_L, fontSize: 11, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</Text>
                <Text style={{ color: TEXT1_L, fontSize: 11, fontWeight: '500' }}>{v}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Platform tabs */}
      {phase === 'result' && (
        <View style={{ borderBottomWidth: 1, borderColor: BORDER_L, backgroundColor: CARD_L }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
            {PLATFORMS.map(({ id, label, Icon }) => (
              <TouchableOpacity key={id} onPress={() => setActivePlatform(id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: activePlatform === id ? PRIMARY_L : CARD_L, borderWidth: 1, borderColor: activePlatform === id ? PRIMARY_L : BORDER_L }}
                activeOpacity={0.8}>
                <Icon size={12} color={activePlatform === id ? '#fff' : TEXT3_L} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: activePlatform === id ? '#fff' : TEXT2_L }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Config phase */}
      {phase === 'config' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {!pickedImage && (
            <View style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <Text style={{ color: '#f59e0b', fontSize: 13, textAlign: 'center' }}>Go back and upload a product image first.</Text>
            </View>
          )}
          <OptionRow label="Language" options={['English', 'Turkish', 'Spanish', 'German'] as Language[]} value={language} onChange={setLanguage} />
          <OptionRow label="Tone" options={['professional', 'luxury', 'casual', 'fun'] as Tone[]} value={tone} onChange={setTone} />
          <OptionRow label="Length" options={['short', 'medium', 'long'] as ListingLength[]} value={length} onChange={setLength} />
          <TouchableOpacity onPress={handleGenerate} disabled={!pickedImage || isGenerating}
            style={{ marginTop: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingVertical: 16, gap: 8, backgroundColor: !pickedImage || isGenerating ? BORDER_L : PRIMARY_L, opacity: !pickedImage ? 0.5 : 1 }}
            activeOpacity={0.8}>
            {isGenerating
              ? <><ActivityIndicator size="small" color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Generating…</Text></>
              : <Text style={{ fontWeight: '700', fontSize: 14, color: !pickedImage ? TEXT3_L : '#fff' }}>Generate Listing</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Result phase */}
      {phase === 'result' && listing && (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Global */}
            {activePlatform === 'global' && (
              <>
                <Card label="Title" copyText={listing.global.title}>
                  <EditableText bold value={listing.global.title} onChange={v => patchGlobal({ title: v })} />
                </Card>
                <Card label="Short Description" copyText={listing.global.short_description}>
                  <EditableText value={listing.global.short_description} onChange={v => patchGlobal({ short_description: v })} />
                </Card>
                <Card label="Long Description" copyText={listing.global.long_description}>
                  <EditableText value={listing.global.long_description} onChange={v => patchGlobal({ long_description: v })} />
                </Card>
                <Card label="Keywords" copyText={listing.global.keywords.join(', ')}>
                  <EditableTags items={listing.global.keywords} onChange={v => patchGlobal({ keywords: v })} />
                </Card>
              </>
            )}

            {/* Etsy */}
            {activePlatform === 'etsy' && (
              <>
                <Card label="Title" copyText={listing.etsy.title}>
                  <EditableText bold value={listing.etsy.title} onChange={v => patchEtsy({ title: v })} />
                </Card>
                <Card label="Tags" copyText={listing.etsy.tags.join(', ')}>
                  <EditableTags items={listing.etsy.tags} onChange={v => patchEtsy({ tags: v })} />
                </Card>
                {(Object.entries(listing.etsy.description) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
                  <Card key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} copyText={v}>
                    <EditableText value={v} onChange={nv => patchEtsyDesc({ [k]: nv })} />
                  </Card>
                ))}
              </>
            )}

            {/* Amazon */}
            {activePlatform === 'amazon' && (
              <>
                <Card label="Title" copyText={listing.amazon.title}>
                  <EditableText bold value={listing.amazon.title} onChange={v => patchAmazon({ title: v })} />
                </Card>
                <Card label="Bullet Points" copyText={listing.amazon.bullets.join('\n')}>
                  {listing.amazon.bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Text style={{ color: '#818cf8', fontWeight: '700', fontSize: 14 }}>•</Text>
                      <View style={{ flex: 1 }}>
                        <EditableText value={b} onChange={v => patchAmazon({ bullets: listing.amazon.bullets.map((x, j) => j === i ? v : x) })} />
                      </View>
                    </View>
                  ))}
                </Card>
                <Card label="Description" copyText={listing.amazon.description}>
                  <EditableText value={listing.amazon.description} onChange={v => patchAmazon({ description: v })} />
                </Card>
                <Card label="Backend Keywords" copyText={listing.amazon.backend_keywords.join(', ')}>
                  <EditableTags items={listing.amazon.backend_keywords} onChange={v => patchAmazon({ backend_keywords: v })} />
                </Card>
              </>
            )}

            {/* Instagram */}
            {activePlatform === 'instagram' && (
              <>
                <Card label="Caption" copyText={listing.instagram.caption}>
                  <EditableText value={listing.instagram.caption} onChange={v => patchInstagram({ caption: v })} />
                </Card>
                <Card label="Hashtags" copyText={listing.instagram.hashtags.join(' ')}>
                  <EditableTags items={listing.instagram.hashtags} onChange={v => patchInstagram({ hashtags: v })} />
                </Card>
              </>
            )}

            {/* TikTok */}
            {activePlatform === 'tiktok' && (
              <>
                <Card label="Hook" copyText={listing.tiktok.hook}>
                  <EditableText bold value={listing.tiktok.hook} onChange={v => patchTiktok({ hook: v })} />
                </Card>
                <Card label="Caption" copyText={listing.tiktok.caption}>
                  <EditableText value={listing.tiktok.caption} onChange={v => patchTiktok({ caption: v })} />
                </Card>
                <Card label="Hashtags" copyText={listing.tiktok.hashtags.join(' ')}>
                  <EditableTags items={listing.tiktok.hashtags} onChange={v => patchTiktok({ hashtags: v })} />
                </Card>
              </>
            )}
          </ScrollView>

          {/* Bottom action bar */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 12, paddingTop: 12, paddingHorizontal: 16, backgroundColor: BG_L, borderTopWidth: 1, borderColor: BORDER_L, flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => Clipboard.setStringAsync(copyAllForPlatform())}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: CARD_L, borderWidth: 1, borderColor: BORDER_L, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              activeOpacity={0.8}>
              <Copy size={14} color={TEXT2_L} />
              <Text style={{ color: TEXT2_L, fontWeight: '700', fontSize: 13 }}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: CARD_L, borderWidth: 1, borderColor: BORDER_L, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              activeOpacity={0.8}>
              <Settings2 size={14} color={TEXT2_L} />
              <Text style={{ color: TEXT2_L, fontWeight: '700', fontSize: 13 }}>Ask AI</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhase('config')}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: PRIMARY_L, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              activeOpacity={0.8}>
              <Settings2 size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
