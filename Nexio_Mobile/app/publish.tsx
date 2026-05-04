import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Share, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Globe, Check, Share2, MessageCircle, ChevronRight, Store, Eye, EyeOff } from 'lucide-react-native';
import { useAdStore } from '../src/store/adStore';
import { publishKit, getMyStore, toggleKitVisibility, type StoreInfo } from '../src/services/storeService';

const BG      = '#0B0B0F';
const CARD    = '#131320';
const BORDER  = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1   = '#FFFFFF';
const TEXT2   = '#8B8BA7';
const TEXT3   = '#3A3A52';
const GREEN   = '#34d399';

// Stable per-device userId derived from expo-constants or generated once
function getDeviceUserId(): string {
  const key = 'nexio_user_id';
  // Use a simple deterministic ID based on a random value stored in memory for the session
  // In production, replace with real auth userId
  if (!(global as any).__nexioUserId) {
    (global as any).__nexioUserId = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return (global as any).__nexioUserId;
}

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const { variations, listingResult, selectedCategory, goal } = useAdStore();

  const [slug,       setSlug]       = useState('');
  const [name,       setName]       = useState('');
  const [tagline,    setTagline]    = useState('');
  const [whatsapp,   setWhatsapp]   = useState('');
  const [email,      setEmail]      = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published,  setPublished]  = useState<{ storeUrl: string; productUrl: string } | null>(null);
  const [existingStore, setExistingStore] = useState<StoreInfo | null>(null);
  const [loadingStore,  setLoadingStore]  = useState(true);

  const userId   = getDeviceUserId();
  const kitId    = `kit_${Date.now().toString(36)}`;
  const productName = listingResult?.global?.title?.split(/[\s,]+/).slice(0, 5).join(' ')
                   || listingResult?.product_analysis?.product_type
                   || selectedCategory
                   || 'My Product';

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
        }
      })
      .catch(() => {})
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
        userId,
        storeSlug: cleanSlug,
        displayName: name.trim(),
        tagline: tagline.trim(),
        contactWhatsapp: whatsapp.trim(),
        contactEmail: email.trim(),
        kitId,
        productName,
        category: selectedCategory,
        goal,
        variations,
        listingResult,
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
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {
      Share.share({ message: text });
    });
  }

  function shareLink(url: string) {
    Share.share({ message: url, url });
  }

  // ── Success state ──────────────────────────────────────────────────────────
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
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(52,211,153,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)' }}>
            <Check size={32} color={GREEN} />
          </View>
          <Text style={{ color: TEXT1, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>Your product is live!</Text>
          <Text style={{ color: TEXT2, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Customers can now discover and contact you through your store.
          </Text>

          {/* Product URL */}
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

          {/* Store URL */}
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

  // ── Publish form ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={TEXT2} />
        </TouchableOpacity>
        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16 }}>Publish to Store</Text>
        <View style={{ width: 38 }} />
      </View>

      {loadingStore ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>

          {/* Product preview */}
          <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(92,59,229,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{productName}</Text>
              <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{selectedCategory} · {variations.filter(v => v.status === 'completed').length} images</Text>
            </View>
            {existingStore && (
              <View style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: GREEN, fontSize: 10, fontWeight: '700' }}>Store exists</Text>
              </View>
            )}
          </View>

          {/* Store URL */}
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>
            {existingStore ? 'Store Settings' : 'Create Your Store'}
          </Text>

          <Field label="Store URL *" hint="yourstore.app/store/...">
            <TextInput
              value={slug}
              onChangeText={t => setSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-store"
              placeholderTextColor={TEXT3}
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
          </Field>

          <Field label="Display Name *">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your Store Name"
              placeholderTextColor={TEXT3}
              style={inputStyle}
            />
          </Field>

          <Field label="Tagline" hint="Short description shown on your store">
            <TextInput
              value={tagline}
              onChangeText={setTagline}
              placeholder="Handmade with love"
              placeholderTextColor={TEXT3}
              style={inputStyle}
            />
          </Field>

          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15, marginBottom: 6, marginTop: 8 }}>Contact Info</Text>
          <Text style={{ color: TEXT2, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
            Customers use these to reach you. At least one is required.
          </Text>

          <Field label="WhatsApp Number" hint="Include country code, e.g. +1234567890">
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+1 234 567 8900"
              placeholderTextColor={TEXT3}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </Field>

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={TEXT3}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle}
            />
          </Field>
        </ScrollView>
      )}

      {/* Publish button */}
      {!loadingStore && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: BG }}>
          <TouchableOpacity onPress={handlePublish} disabled={publishing} activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 16, backgroundColor: PRIMARY, opacity: publishing ? 0.7 : 1, shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}>
            {publishing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Globe size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {publishing ? 'Publishing…' : existingStore ? 'Update & Publish' : 'Publish to Store'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#1A1A2E',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: BORDER,
  color: TEXT1,
  fontSize: 14,
  paddingHorizontal: 14,
  paddingVertical: 13,
  width: '100%' as const,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: TEXT2, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      {children}
      {hint && <Text style={{ color: TEXT3, fontSize: 11, marginTop: 5 }}>{hint}</Text>}
    </View>
  );
}
