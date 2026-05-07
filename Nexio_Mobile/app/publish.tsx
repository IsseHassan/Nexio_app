import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Share, Linking, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  X, Globe, Check, Share2, MessageCircle, Store, Eye,
  Sparkles, Phone, Tag, RefreshCw, Edit2,
} from 'lucide-react-native';
import { useAdStore } from '../src/store/adStore';
import { publishKit, getMyStore, type StoreInfo } from '../src/services/storeService';

const BG      = '#EDE4DC';
const CARD    = '#F6F2EE';
const BORDER  = '#CFCBC7';
const PRIMARY = '#E8664A';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';
const GREEN   = '#34C759';

function getDeviceUserId(): string {
  if (!(global as any).__nexioUserId) {
    (global as any).__nexioUserId = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return (global as any).__nexioUserId;
}

function generateStoreSuggestion(productName: string, category: string) {
  const words = (productName || category || 'my').split(/[\s,]+/).filter(Boolean);
  const prefix = (words[0] || 'my').replace(/[^a-zA-Z]/g, '') || 'my';
  const name = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase() + 'Hub';
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tagline = `Premium ${(category || 'products').toLowerCase()}. Trusted quality.`;
  return { slug, name, tagline };
}

function FormField({ icon, label, hint, children, hasCheck }: {
  icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode; hasCheck?: boolean;
}) {
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>{label}</Text>
          {children}
        </View>
        {hasCheck && (
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.1)', borderWidth: 1, borderColor: 'rgba(52,199,89,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={12} color={GREEN} strokeWidth={3} />
          </View>
        )}
      </View>
      {hint && <Text style={{ color: TEXT3, fontSize: 11, marginTop: 5, marginBottom: 14, paddingLeft: 52 }}>{hint}</Text>}
    </View>
  );
}

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const { variations, listingResult, selectedCategory, goal, pickedImage } = useAdStore();

  const [slug,       setSlug]       = useState('');
  const [name,       setName]       = useState('');
  const [tagline,    setTagline]    = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [email,      setEmail]      = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published,  setPublished]  = useState<{ storeUrl: string; productUrl: string } | null>(null);
  const [existingStore, setExistingStore] = useState<StoreInfo | null>(null);
  const [loadingStore,  setLoadingStore]  = useState(true);
  const [aiEditing, setAiEditing] = useState(false);

  const userId      = getDeviceUserId();
  const kitId       = `kit_${Date.now().toString(36)}`;
  const productName = listingResult?.global?.title?.split(/[\s,]+/).slice(0, 5).join(' ')
                   || listingResult?.product_analysis?.product_type
                   || selectedCategory
                   || 'My Product';
  const assetCount  = variations.filter(v => v.status === 'completed').length;
  const suggestion  = generateStoreSuggestion(productName, selectedCategory);

  useEffect(() => {
    getMyStore(userId)
      .then(data => {
        if (data.store) {
          setExistingStore(data.store);
          setSlug(data.store.slug);
          setName(data.store.displayName);
          setTagline(data.store.tagline ?? '');
          setWhatsapp(data.store.contactWhatsapp ?? '');
          setEmail(data.store.contactEmail ?? '');
        } else {
          setSlug(suggestion.slug);
          setName(suggestion.name);
          setTagline(suggestion.tagline);
        }
      })
      .catch(() => {
        setSlug(suggestion.slug);
        setName(suggestion.name);
        setTagline(suggestion.tagline);
      })
      .finally(() => setLoadingStore(false));
  }, []);

  async function handlePublish() {
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!cleanSlug) { Alert.alert('Required', 'Please enter a store URL.'); return; }
    if (!name.trim()) { Alert.alert('Required', 'Please enter a store name.'); return; }
    if (!whatsapp.trim() && !email.trim()) {
      Alert.alert('Contact required', 'Add a WhatsApp number or email so customers can reach you.');
      return;
    }
    setPublishing(true);
    try {
      const result = await publishKit({
        userId, storeSlug: cleanSlug, displayName: name.trim(),
        tagline: tagline.trim(), contactWhatsapp: whatsapp.trim(),
        contactEmail: email.trim(), kitId, productName,
        category: selectedCategory, goal, variations, listingResult,
      });
      setPublished({ storeUrl: result.storeUrl, productUrl: result.productUrl });
    } catch (e: any) {
      Alert.alert('Publish failed', e.message ?? 'Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  function shareWhatsApp(url: string) {
    const text = `Check out my product: ${url}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => Share.share({ message: text }));
  }

  function shareLink(url: string) {
    Share.share({ message: url, url });
  }

  if (published) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
          <View style={{ width: 38 }} />
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16 }}>Published!</Text>
          <TouchableOpacity onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color={TEXT2} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center', paddingTop: 20 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(52,199,89,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(52,199,89,0.3)' }}>
            <Check size={32} color={GREEN} />
          </View>
          <Text style={{ color: TEXT1, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>Your product is live!</Text>
          <Text style={{ color: TEXT2, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Customers can now discover and contact you through your store.
          </Text>
          <View style={{ width: '100%', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Product Link</Text>
            <Text style={{ color: PRIMARY, fontSize: 12, marginBottom: 12 }} numberOfLines={1}>{published.productUrl}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => shareWhatsApp(published.productUrl)} activeOpacity={0.85}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#25D366', borderRadius: 12 }}>
                <MessageCircle size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => shareLink(published.productUrl)} activeOpacity={0.85}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12 }}>
                <Share2 size={16} color={TEXT2} />
                <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 13 }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ width: '100%', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Your Store</Text>
            <Text style={{ color: TEXT2, fontSize: 12, marginBottom: 12 }} numberOfLines={1}>{published.storeUrl}</Text>
            <TouchableOpacity onPress={() => shareLink(published.storeUrl)} activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: PRIMARY, borderRadius: 12 }}>
              <Globe size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Share Store Link</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={{ color: TEXT2, fontSize: 14, fontWeight: '600' }}>Back to Kit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', backgroundColor: CARD, borderBottomWidth: 1, borderColor: BORDER }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ position: 'absolute', left: 20, top: 14, width: 38, height: 38, borderRadius: 12, backgroundColor: BG, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={TEXT2} />
        </TouchableOpacity>
        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17 }}>Publish to Store</Text>
        <Text style={{ color: TEXT2, fontSize: 12, marginTop: 3 }}>Make your product live in minutes</Text>
      </View>

      {loadingStore ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

          {/* Product preview card */}
          <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {pickedImage ? (
              <Image source={{ uri: pickedImage.uri }} style={{ width: 76, height: 76, borderRadius: 14 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: '#F3EDE8', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={28} color={TEXT3} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15, marginBottom: 4 }} numberOfLines={2}>{productName}</Text>
              <Text style={{ color: TEXT2, fontSize: 12, marginBottom: 8 }}>{selectedCategory} · {assetCount} assets</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(52,199,89,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Check size={11} color={GREEN} strokeWidth={3} />
                <Text style={{ color: GREEN, fontSize: 11, fontWeight: '700' }}>Ready to publish</Text>
              </View>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color={PRIMARY} />
            </View>
          </View>

          {/* AI Store Setup card */}
          <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>AI Store Setup</Text>
                <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>Smart details generated by AI to help you go live faster.</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12 }}>
                <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '600', marginBottom: 4 }}>Store Name</Text>
                {aiEditing ? (
                  <TextInput value={name} onChangeText={setName} style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }} />
                ) : (
                  <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }}>{name || suggestion.name}</Text>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12 }}>
                <Text style={{ color: TEXT3, fontSize: 10, fontWeight: '600', marginBottom: 4 }}>Store URL</Text>
                {aiEditing ? (
                  <TextInput value={slug} onChangeText={t => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }} />
                ) : (
                  <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }}>{(slug || suggestion.slug) + '.store'}</Text>
                )}
              </View>
            </View>

            <View style={{ backgroundColor: 'rgba(232,102,74,0.08)', borderRadius: 10, padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={13} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontSize: 12, flex: 1 }}>
                Optimized for the {selectedCategory.toLowerCase()} niche to attract the right customers.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setAiEditing(!aiEditing)} activeOpacity={0.8}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD }}>
                <Edit2 size={14} color={TEXT2} />
                <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 13 }}>{aiEditing ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const s = generateStoreSuggestion(productName + Date.now(), selectedCategory);
                  setSlug(s.slug); setName(s.name); setTagline(s.tagline);
                }}
                activeOpacity={0.8}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: PRIMARY, backgroundColor: 'rgba(232,102,74,0.08)' }}>
                <RefreshCw size={14} color={PRIMARY} />
                <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 13 }}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Information */}
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17, marginBottom: 14 }}>Store Information</Text>

          <FormField icon={<Globe size={16} color={TEXT2} />} label="Store URL *" hint="yourstore.app/store/..." hasCheck={!!slug.trim()}>
            <TextInput
              value={slug}
              onChangeText={t => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-store"
              placeholderTextColor={TEXT3}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: TEXT1, fontSize: 14 }}
            />
          </FormField>

          <FormField icon={<Store size={16} color={TEXT2} />} label="Display Name *" hint="This is how your store will appear to customers." hasCheck={!!name.trim()}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your Store Name"
              placeholderTextColor={TEXT3}
              style={{ color: TEXT1, fontSize: 14 }}
            />
          </FormField>

          <FormField icon={<Tag size={16} color={TEXT2} />} label="Tagline" hint="Short description shown on your store.">
            <TextInput
              value={tagline}
              onChangeText={setTagline}
              placeholder="Premium cars. Trusted drives."
              placeholderTextColor={TEXT3}
              style={{ color: TEXT1, fontSize: 14 }}
            />
          </FormField>

          <FormField icon={<Phone size={16} color={TEXT2} />} label="Contact (WhatsApp)" hint="Customers will use this to reach you." hasCheck={!!whatsapp.trim()}>
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+1 234 567 8900"
              placeholderTextColor={TEXT3}
              keyboardType="phone-pad"
              style={{ color: TEXT1, fontSize: 14 }}
            />
          </FormField>

          {/* Store Preview */}
          {listingResult && (
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17 }}>Store Preview</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} activeOpacity={0.7}>
                  <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '600' }}>View Full Preview</Text>
                  <Text style={{ color: PRIMARY, fontSize: 13 }}>↗</Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16 }}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                  {pickedImage ? (
                    <Image source={{ uri: pickedImage.uri }} style={{ width: 90, height: 90, borderRadius: 14 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 14, backgroundColor: '#F3EDE8' }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 6 }} numberOfLines={2}>{productName}</Text>
                    <Text style={{ color: TEXT2, fontSize: 12, lineHeight: 18, marginBottom: 12 }} numberOfLines={3}>
                      {listingResult.global.short_description}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(listingResult.global.keywords ?? []).slice(0, 3).map((kw, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ color: TEXT2, fontSize: 11 }}>{kw}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* Bottom bar */}
      {!loadingStore && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: BG, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity activeOpacity={0.8}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 16, backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER }}>
            <Eye size={17} color={TEXT2} />
            <Text style={{ color: TEXT2, fontWeight: '700', fontSize: 15 }}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePublish} disabled={publishing} activeOpacity={0.85}
            style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 16, backgroundColor: PRIMARY, opacity: publishing ? 0.7 : 1 }}>
            {publishing ? <ActivityIndicator color="#fff" size="small" /> : <Globe size={17} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {publishing ? 'Publishing…' : 'Publish to Store'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
