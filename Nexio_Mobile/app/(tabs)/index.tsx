import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Bell, Image as ImageIcon, FileText, Hash,
  ChevronRight, Package,
} from 'lucide-react-native';
import { useAdStore } from '../../src/store/adStore';
import { useAuth } from '../../src/auth/AuthContext';
import { loadHistory, loadKitFull, type KitEntry } from '../../src/services/historyService';

const BG   = '#0B0B0F';
const CARD = '#131320';
const BORDER = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1 = '#FFFFFF';
const TEXT2 = '#8B8BA7';
const TEXT3 = '#3A3A52';

const QUICK_ACTIONS = [
  { label: 'Generate\nImages',  Icon: ImageIcon,  color: '#5C3BE5', bg: 'rgba(92,59,229,0.12)' },
  { label: 'Generate\nListing', Icon: FileText,   color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  { label: 'Social\nPack',      Icon: Hash,  color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
];

const FEATURE_GRID = [
  { label: 'Product Photos',      Icon: ImageIcon,  desc: '6 ad-ready images' },
  { label: 'Listing Generator',   Icon: FileText,   desc: 'All platforms' },
  { label: 'Marketplace Export',  Icon: Package,    desc: 'Amazon · Etsy · Shopify' },
  { label: 'Hash Pack',      Icon: Hash,  desc: 'Caption + hashtags' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { pickedImage } = useAdStore();
  const restoreKit = useAdStore(s => s.restoreKit);
  const { user } = useAuth();

  const [recentKits, setRecentKits] = useState<KitEntry[]>([]);

  useFocusEffect(useCallback(() => {
    loadHistory().then(h => setRecentKits(h.slice(0, 3)));
  }, []));

  async function openKit(entry: KitEntry) {
    const full = await loadKitFull(entry.id);
    if (!full) return;
    restoreKit(full);
    router.push('/kit');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>A</Text>
          </View>
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16, letterSpacing: -0.3 }}>
            Ad<Text style={{ color: '#818cf8' }}>Genius</Text> <Text style={{ color: TEXT2, fontWeight: '400', fontSize: 13 }}>AI</Text>
          </Text>
        </View>
        <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={18} color={TEXT2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          <Text style={{ color: TEXT1, fontSize: 28, fontWeight: '800', lineHeight: 36, letterSpacing: -0.5 }}>
            Turn one photo into{'\n'}a complete product kit
          </Text>
          <Text style={{ color: PRIMARY, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
            that sells.
          </Text>
          <Text style={{ color: TEXT2, fontSize: 13, marginTop: 10, lineHeight: 20 }}>
            Upload one product photo and get images, listing, social content — export-ready in 60 seconds.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => router.push('/create')}
            activeOpacity={0.85}
            style={{
              marginTop: 20, borderRadius: 16, overflow: 'hidden',
              backgroundColor: PRIMARY,
              shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
              {pickedImage
                ? <Image source={{ uri: pickedImage.uri }} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#27272a' }} />
                : <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={20} color="rgba(255,255,255,0.8)" />
                  </View>
              }
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create Product Kit</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Upload a product photo to get started</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {QUICK_ACTIONS.map(({ label, Icon, color, bg }) => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push('/create')}
                activeOpacity={0.8}
                style={{ flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={{ color: TEXT2, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Kits */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>Recent Kits</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
              <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentKits.length === 0 ? (
            <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 24, alignItems: 'center', gap: 8 }}>
              <Package size={26} color={TEXT3} />
              <Text style={{ color: TEXT2, fontSize: 13, fontWeight: '600' }}>No kits yet</Text>
              <Text style={{ color: TEXT3, fontSize: 12 }}>Your generated kits will appear here</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentKits.map(kit => (
                <TouchableOpacity
                  key={kit.id}
                  activeOpacity={0.8}
                  onPress={() => openKit(kit)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 12, gap: 12, overflow: 'hidden' }}
                >
                  {kit.thumbnailUri ? (
                    <Image source={{ uri: kit.thumbnailUri }} style={{ width: 48, height: 48, borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#1E1E2E', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={22} color={TEXT3} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{kit.name}</Text>
                    <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{kit.category} · {timeAgo(kit.createdAt)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '700' }}>Ready</Text>
                    </View>
                    <ChevronRight size={14} color={TEXT3} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Feature grid */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>What's included</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {FEATURE_GRID.map(({ label, Icon, desc }) => (
              <View key={label} style={{ width: '47.5%', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(92,59,229,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={18} color={PRIMARY} />
                </View>
                <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 13, marginBottom: 3 }}>{label}</Text>
                <Text style={{ color: TEXT2, fontSize: 11 }}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
