import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions,
  ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Sparkles, ImageIcon, FileText, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useAdStore, type GenerationGoal } from '../src/store/adStore';

const { width: SW, height: SH } = Dimensions.get('window');

const PRIMARY = '#E8664A';
const DARK    = '#1E1410';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';

export const ONBOARDING_FLAG = `${FileSystem.documentDirectory}onboarding_complete_v2`;

export async function markOnboardingComplete() {
  await FileSystem.writeAsStringAsync(ONBOARDING_FLAG, '1');
}

export async function isOnboardingComplete(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(ONBOARDING_FLAG);
  return info.exists;
}

const GOAL_OPTIONS = [
  { id: 'full'    as GenerationGoal, label: 'Full Kit',   desc: 'Photos + listing + social', Icon: Sparkles,  color: PRIMARY },
  { id: 'images'  as GenerationGoal, label: 'Photos',     desc: 'Product photography',        Icon: ImageIcon, color: PRIMARY },
  { id: 'listing' as GenerationGoal, label: 'Listing',    desc: 'Etsy / Amazon copy',         Icon: FileText,  color: PRIMARY },
  { id: 'social'  as GenerationGoal, label: 'Social',     desc: 'Instagram & TikTok posts',   Icon: Share2,    color: PRIMARY },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setGoal = useAdStore(s => s.setGoal);
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<GenerationGoal>('full');
  const scrollRef = useRef<ScrollView>(null);

  function goTo(n: number) {
    setStep(n);
    scrollRef.current?.scrollTo({ x: n * SW, animated: true });
  }

  async function finish() {
    setGoal(selectedGoal);
    await markOnboardingComplete();
    router.replace('/(auth)/login');
  }

  async function skip() {
    await markOnboardingComplete();
    router.replace('/(auth)/login');
  }

  const ILL_H = SH * 0.52;

  return (
    <View style={{ flex: 1, backgroundColor: DARK }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* ── Slide 1: Welcome ──────────────────────────────────── */}
        <View style={{ width: SW, height: SH }}>
          {/* Illustration area */}
          <LinearGradient
            colors={[DARK, '#3D1C0E', PRIMARY]}
            locations={[0, 0.45, 1]}
            style={{ height: ILL_H, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(232,102,74,0.12)', top: -80, alignSelf: 'center' }} />
            <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(232,102,74,0.1)', bottom: 30, right: -60 }} />

            <Image
              source={require('../assets/icon.png')}
              style={{ width: 110, height: 110, borderRadius: 30, marginBottom: 28, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } }}
            />
            <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1.5, marginBottom: 8 }}>Nexio</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500' }}>AI Product Kit Generator</Text>
          </LinearGradient>

          {/* Content card */}
          <View style={{ flex: 1, backgroundColor: '#FAF7F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingHorizontal: 28, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: TEXT1, letterSpacing: -0.8, lineHeight: 38, marginBottom: 12 }}>
              Turn any photo into a{' '}
              <Text style={{ color: PRIMARY }}>complete seller kit</Text>
            </Text>
            <Text style={{ color: TEXT2, fontSize: 15, lineHeight: 26, marginBottom: 32 }}>
              Upload a product photo. AI builds your listings, product images, and social posts — in seconds.
            </Text>

            <TouchableOpacity onPress={() => goTo(1)} activeOpacity={0.88}>
              <LinearGradient
                colors={['#F07848', PRIMARY]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Get Started</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={skip} style={{ marginTop: 18, alignItems: 'center' }} activeOpacity={0.7}>
              <Text style={{ color: TEXT3, fontSize: 13 }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Slide 2: How it works ─────────────────────────────── */}
        <View style={{ width: SW, height: SH }}>
          <LinearGradient
            colors={[DARK, '#3D1C0E', PRIMARY]}
            locations={[0, 0.45, 1]}
            style={{ height: ILL_H, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(232,102,74,0.12)', top: -80, alignSelf: 'center' }} />

            {[
              { emoji: '📸', label: 'Upload photo', step: '01' },
              { emoji: '✨', label: 'AI generates kit', step: '02' },
              { emoji: '🚀', label: 'Publish & sell', step: '03' },
            ].map((item, i) => (
              <View
                key={item.step}
                style={{
                  width: SW * 0.74,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 18,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: i < 2 ? 12 : 0,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 }}>STEP {item.step}</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{item.label}</Text>
                </View>
              </View>
            ))}
          </LinearGradient>

          <View style={{ flex: 1, backgroundColor: '#FAF7F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingHorizontal: 28, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: TEXT1, letterSpacing: -0.8, lineHeight: 38, marginBottom: 12 }}>
              Ready in{' '}
              <Text style={{ color: PRIMARY }}>under a minute</Text>
            </Text>
            <Text style={{ color: TEXT2, fontSize: 15, lineHeight: 26, marginBottom: 32 }}>
              Pick a photo, choose what to generate, and Nexio handles the rest — photos, copy, and social content all at once.
            </Text>

            <TouchableOpacity onPress={() => goTo(2)} activeOpacity={0.88}>
              <LinearGradient
                colors={['#F07848', PRIMARY]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Next</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Slide 3: Goal selection ───────────────────────────── */}
        <View style={{ width: SW, height: SH }}>
          <LinearGradient
            colors={[DARK, '#3D1C0E', PRIMARY]}
            locations={[0, 0.45, 1]}
            style={{ height: ILL_H * 0.55, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(232,102,74,0.12)', top: -120, alignSelf: 'center' }} />
            <Text style={{ fontSize: 72, marginBottom: 12 }}>🎯</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' }}>What are you building?</Text>
          </LinearGradient>

          <View style={{ flex: 1, backgroundColor: '#FAF7F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 20 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: TEXT1, letterSpacing: -0.6, marginBottom: 4 }}>
              Pick your <Text style={{ color: PRIMARY }}>goal</Text>
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 20 }}>You can change this anytime.</Text>

            <View style={{ gap: 10, marginBottom: 24 }}>
              {GOAL_OPTIONS.map(({ id, label, desc, Icon }) => {
                const active = selectedGoal === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setSelectedGoal(id)}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: active ? 'rgba(232,102,74,0.08)' : '#fff',
                      borderRadius: 16,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? PRIMARY : '#E8E3DE',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      gap: 12,
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: active ? 'rgba(232,102,74,0.12)' : '#F6F2EE', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={active ? PRIMARY : '#ADADAD'} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: active ? PRIMARY : TEXT1, fontWeight: '700', fontSize: 14, marginBottom: 1 }}>{label}</Text>
                      <Text style={{ color: TEXT2, fontSize: 11 }}>{desc}</Text>
                    </View>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: active ? PRIMARY : 'transparent',
                      borderWidth: active ? 0 : 1.5,
                      borderColor: '#CFCBC7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {active && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={finish} activeOpacity={0.88}>
              <LinearGradient
                colors={['#F07848', PRIMARY]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Start Creating</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Dot indicators */}
      <View style={{ position: 'absolute', top: insets.top + 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{
            width: step === i ? 22 : 7, height: 7, borderRadius: 3.5,
            backgroundColor: step === i ? '#fff' : 'rgba(255,255,255,0.35)',
          }} />
        ))}
      </View>
    </View>
  );
}
