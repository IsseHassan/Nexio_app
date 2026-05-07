import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Image as ImageIcon, Mic, Sparkles, Package,
  ChevronRight, FileText, Share2, Megaphone, Hash,
} from 'lucide-react-native';
import { useAdStore } from '../../src/store/adStore';
import { useAuth } from '../../src/auth/AuthContext';
import { loadHistory, loadKitFull, type KitEntry } from '../../src/services/historyService';

const { width: SW } = Dimensions.get('window');

const BG    = '#EDE4DC';
const CARD  = '#FAF7F4';
const ACCENT = '#E8664A';
const TEXT1 = '#2B2B2B';
const TEXT2 = '#7A7A7A';
const TEXT3 = '#ADADAD';

const GOAL_ITEMS = [
  { id: 'Full Kit',  label: 'Full Kit', Icon: Sparkles },
  { id: 'Photos',   label: 'Photos',   Icon: ImageIcon },
  { id: 'Listing',  label: 'Listing',  Icon: FileText },
  { id: 'Social',   label: 'Social',   Icon: Share2 },
] as const;

const QUICK_START = [
  { label: 'Product\nPhotos',  Icon: ImageIcon,  bg: 'rgba(232,102,74,0.12)',  color: '#E8664A' },
  { label: 'Listing\nCopy',    Icon: FileText,   bg: 'rgba(180,140,60,0.12)',  color: '#B48C40' },
  { label: 'Social\nContent',  Icon: Hash,       bg: 'rgba(60,160,90,0.12)',   color: '#3CA05A' },
  { label: 'Ad\nCreatives',    Icon: Megaphone,  bg: 'rgba(120,90,210,0.12)',  color: '#785AD2' },
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
  const [selectedGoal, setSelectedGoal] = useState('Full Kit');
  const [aiQuery, setAiQuery] = useState('');

  useFocusEffect(useCallback(() => {
    loadHistory().then(h => setRecentKits(h.slice(0, 6)));
  }, []));

  async function openKit(entry: KitEntry) {
    const full = await loadKitFull(entry.id);
    if (!full) return;
    restoreKit(full);
    router.push('/kit');
  }

  const currentKit = recentKits[0] ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
            <Text style={{ color: TEXT1 }}>Ad</Text>
            <Text style={{ color: ACCENT }}>Genius</Text>
            <Text style={{ color: TEXT1 }}> AI</Text>
          </Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={24} color={TEXT1} strokeWidth={1.8} />
            </TouchableOpacity>
            <View style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, borderWidth: 1.5, borderColor: BG }} />
          </View>
        </View>

        {/* Hero card */}
        <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            {/* Left: text + upload button */}
            <View style={{ flex: 1.1, padding: 20, paddingRight: 12 }}>
              <Text style={{ color: TEXT1, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, lineHeight: 26, marginBottom: 8 }}>
                What are you{'\n'}creating?
              </Text>
              <Text style={{ color: TEXT2, fontSize: 12, lineHeight: 18, marginBottom: 18 }}>
                Upload a product or describe it and let AI do the magic.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/create')}
                activeOpacity={0.8}
                style={{ borderWidth: 1.5, borderColor: ACCENT, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8 }}
              >
                <View style={{ position: 'relative', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={28} color={ACCENT} strokeWidth={1.6} />
                  <View style={{ position: 'absolute', bottom: -2, right: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 14 }}>+</Text>
                  </View>
                </View>
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>Upload Product Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Right: product image */}
            <View style={{ flex: 1, alignSelf: 'stretch', overflow: 'hidden', minHeight: 220 }}>
              {pickedImage ? (
                <Image source={{ uri: pickedImage.uri }} style={{ flex: 1, width: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, backgroundColor: '#E8DDD4', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={36} color="rgba(140,110,80,0.25)" />
                </View>
              )}
            </View>
          </View>

          {/* AI input row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8, backgroundColor: CARD }}>
            <TouchableOpacity onPress={() => router.push('/create')} style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={15} color={TEXT3} strokeWidth={1.5} />
            </TouchableOpacity>
            <TextInput
              value={aiQuery}
              onChangeText={setAiQuery}
              placeholder="Ask AI to generate content..."
              placeholderTextColor={TEXT3}
              style={{ flex: 1, color: TEXT1, fontSize: 13.5, paddingVertical: 0 }}
              returnKeyType="send"
              onSubmitEditing={() => { if (aiQuery.trim()) router.push('/create'); }}
            />
            <TouchableOpacity style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={17} color={TEXT2} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/create')} activeOpacity={0.85}>
              <LinearGradient
                colors={['#F07848', ACCENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
              >
                <Sparkles size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal pills row */}
        <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 18, padding: 5, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          {GOAL_ITEMS.map(({ id, label, Icon }) => {
            const isActive = selectedGoal === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedGoal(id)}
                activeOpacity={0.8}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 13, backgroundColor: isActive ? 'rgba(232,102,74,0.1)' : 'transparent', borderWidth: isActive ? 1 : 0, borderColor: isActive ? 'rgba(232,102,74,0.4)' : 'transparent' }}
              >
                <Icon size={13} color={isActive ? ACCENT : TEXT2} strokeWidth={isActive ? 2.2 : 1.8} />
                <Text style={{ color: isActive ? ACCENT : TEXT2, fontSize: 12, fontWeight: isActive ? '700' : '500' }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Current kit in-progress card */}
        {currentKit && (
          <TouchableOpacity
            onPress={() => openKit(currentKit)}
            activeOpacity={0.85}
            style={{ marginHorizontal: 16, marginBottom: 22, backgroundColor: CARD, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
          >
            {currentKit.thumbnailUri ? (
              <Image source={{ uri: currentKit.thumbnailUri }} style={{ width: 58, height: 58, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 58, height: 58, borderRadius: 12, backgroundColor: '#E8E0D8', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} color={TEXT3} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14, marginBottom: 3 }} numberOfLines={1}>{currentKit.name}</Text>
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 9 }}>In progress</Text>
              <View style={{ height: 4, backgroundColor: '#E0D8D0', borderRadius: 2 }}>
                <View style={{ height: 4, width: '68%', backgroundColor: ACCENT, borderRadius: 2 }} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22 }}>68%</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>Continue</Text>
                <ChevronRight size={12} color={ACCENT} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Start */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17 }}>Quick Start</Text>
            <TouchableOpacity onPress={() => router.push('/create')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>See all</Text>
              <ChevronRight size={14} color={ACCENT} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: CARD, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 8, flexDirection: 'row' }}>
            {QUICK_START.map(({ label, Icon, bg, color }, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push('/create')}
                activeOpacity={0.8}
                style={{ flex: 1, alignItems: 'center', gap: 10 }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} strokeWidth={1.7} />
                </View>
                <Text style={{ color: TEXT2, fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 15 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Kits */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 17 }}>Recent Kits</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>See all</Text>
              <ChevronRight size={14} color={ACCENT} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {recentKits.length === 0 ? (
            <View style={{ marginHorizontal: 16, backgroundColor: CARD, borderRadius: 18, padding: 28, alignItems: 'center', gap: 8 }}>
              <Package size={28} color={TEXT3} />
              <Text style={{ color: TEXT2, fontSize: 13, fontWeight: '600' }}>No kits yet</Text>
              <Text style={{ color: TEXT3, fontSize: 12 }}>Your generated kits will appear here</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {recentKits.map(kit => (
                <TouchableOpacity
                  key={kit.id}
                  onPress={() => openKit(kit)}
                  activeOpacity={0.9}
                  style={{ width: 148, borderRadius: 16, overflow: 'hidden' }}
                >
                  {kit.thumbnailUri ? (
                    <Image source={{ uri: kit.thumbnailUri }} style={{ width: 148, height: 148 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 148, height: 148, backgroundColor: '#E0D8D0', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={28} color={TEXT3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
