import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import {
  Search, Plus, Package, Trash2,
  ImageIcon, FileText, Share2,
} from 'lucide-react-native';
import { useAdStore } from '../../src/store/adStore';
import {
  loadHistory, loadKitFull, deleteKit,
  type KitEntry,
} from '../../src/services/historyService';

const BG      = '#0B0B0F';
const CARD    = '#131320';
const BORDER  = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1   = '#FFFFFF';
const TEXT2   = '#8B8BA7';
const TEXT3   = '#3A3A52';

const GOAL_LABELS: Record<string, string> = {
  full: 'Full Kit', images: 'Images', listing: 'Listing', social: 'Social',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const restoreKit = useAdStore(s => s.restoreKit);

  const [kits, setKits]         = useState<KitEntry[]>([]);
  const [query, setQuery]       = useState('');
  const [activeCat, setActiveCat] = useState('All');

  async function fetchHistory() {
    const history = await loadHistory();
    setKits(history);
  }

  // Reload whenever the tab comes into focus (after a new kit is generated)
  useFocusEffect(useCallback(() => { fetchHistory(); }, []));

  const categories = ['All', ...Array.from(new Set(kits.map(k => k.category)))];

  const filtered = kits.filter(k =>
    k.name.toLowerCase().includes(query.toLowerCase()) &&
    (activeCat === 'All' || k.category === activeCat),
  );

  async function openKit(entry: KitEntry) {
    const full = await loadKitFull(entry.id);
    if (!full) { Alert.alert('Kit not found', 'This kit may have been deleted.'); return; }
    restoreKit(full);
    router.push('/kit');
  }

  async function confirmDelete(entry: KitEntry) {
    Alert.alert(
      'Delete Kit',
      `Delete "${entry.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteKit(entry.id);
            setKits(prev => prev.filter(k => k.id !== entry.id));
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: TEXT1, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>My Product Kits</Text>
        <TouchableOpacity
          onPress={() => router.push('/create')}
          style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 10 }}
          activeOpacity={0.85}
        >
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, height: 46, gap: 10 }}>
          <Search size={16} color={TEXT3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your kits..."
            placeholderTextColor={TEXT3}
            style={{ flex: 1, color: TEXT1, fontSize: 14 }}
          />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 4 }}
        style={{ maxHeight: 44, marginBottom: 16 }}
      >
        {categories.map(c => {
          const active = activeCat === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveCat(c)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
                backgroundColor: active ? PRIMARY : CARD,
                borderWidth: 1, borderColor: active ? PRIMARY : BORDER,
              }}
            >
              <Text style={{ color: active ? '#fff' : TEXT2, fontSize: 13, fontWeight: '600' }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Kit list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>

        {kits.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
              <Package size={32} color={TEXT3} />
            </View>
            <Text style={{ color: TEXT2, fontSize: 16, fontWeight: '700' }}>No kits yet</Text>
            <Text style={{ color: TEXT3, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Generate your first product kit{'\n'}and it will appear here.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/create')}
              activeOpacity={0.85}
              style={{ marginTop: 4, backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create First Kit</Text>
            </TouchableOpacity>
          </View>
        )}

        {kits.length > 0 && filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Package size={28} color={TEXT3} />
            <Text style={{ color: TEXT2, fontSize: 15, fontWeight: '600' }}>No kits found</Text>
            <Text style={{ color: TEXT3, fontSize: 13 }}>Try a different search or category</Text>
          </View>
        )}

        {filtered.map(kit => (
          <TouchableOpacity
            key={kit.id}
            activeOpacity={0.8}
            onPress={() => openKit(kit)}
            style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' }}
          >
            {/* Thumbnail row */}
            <View style={{ flexDirection: 'row' }}>
              {kit.thumbnailUri ? (
                <Image
                  source={{ uri: kit.thumbnailUri }}
                  style={{ width: 88, height: 88 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 88, height: 88, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={28} color={TEXT3} />
                </View>
              )}

              <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14, lineHeight: 20 }} numberOfLines={2}>{kit.name}</Text>
                    <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{kit.category}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDelete(kit)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Trash2 size={15} color={TEXT3} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(92,59,229,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: PRIMARY, fontSize: 10, fontWeight: '700' }}>{GOAL_LABELS[kit.goal] ?? kit.goal}</Text>
                  </View>
                  <Text style={{ color: TEXT3, fontSize: 11 }}>{timeAgo(kit.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Stats bar */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: BORDER }}>
              {[
                { Icon: ImageIcon,  val: kit.imageCount,    label: 'Images' },
                { Icon: FileText,   val: kit.hasListing ? 4 : 0, label: 'Listings' },
                { Icon: Share2,     val: kit.hasSocial ? 2 : 0,  label: 'Social' },
              ].map(({ Icon, val, label }) => (
                <View key={label} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 }}>
                  <Icon size={14} color={val > 0 ? TEXT2 : TEXT3} />
                  <Text style={{ color: val > 0 ? TEXT1 : TEXT3, fontWeight: '700', fontSize: 13 }}>{val}</Text>
                  <Text style={{ color: TEXT3, fontSize: 9, fontWeight: '600' }}>{label}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
