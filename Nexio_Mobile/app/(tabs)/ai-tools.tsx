import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Sparkles, Image as ImageIcon, FileText, Hash, Megaphone,
  Wand2, ChevronRight, Video,
} from 'lucide-react-native';

const BG      = '#EDE4DC';
const CARD    = '#F6F2EE';
const BORDER  = '#CFCBC7';
const PRIMARY = '#E8664A';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';

const TOOLS = [
  { label: 'Product Video', sub: 'Upload image + prompt → AI video', Icon: Video, color: '#E8664A', bg: 'rgba(232,102,74,0.1)', route: '/video', badge: 'New' },
  { label: 'Product Photos', sub: 'AI-enhanced product images', Icon: ImageIcon, color: '#B48C40', bg: 'rgba(180,140,60,0.1)', route: '/create', badge: null },
  { label: 'Listing Copy', sub: 'SEO-optimised product descriptions', Icon: FileText, color: '#3CA05A', bg: 'rgba(60,160,90,0.1)', route: '/listing', badge: null },
  { label: 'Social Content', sub: 'Posts, captions & hashtags', Icon: Hash, color: '#785AD2', bg: 'rgba(120,90,210,0.1)', route: '/create', badge: null },
  { label: 'Full Kit', sub: 'Photos + listing + social in one go', Icon: Wand2, color: '#E8664A', bg: 'rgba(232,102,74,0.1)', route: '/create', badge: null },
];

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: TEXT1 }}>
            AI <Text style={{ color: PRIMARY }}>Tools</Text>
          </Text>
          <Text style={{ color: TEXT2, fontSize: 13, marginTop: 4 }}>Pick a tool to get started</Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {TOOLS.map(({ label, sub, Icon, color, bg, route, badge }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              activeOpacity={0.85}
              style={{ backgroundColor: CARD, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: BORDER }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>{label}</Text>
                  {badge && (
                    <View style={{ backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>{sub}</Text>
              </View>
              <ChevronRight size={18} color={TEXT3} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
