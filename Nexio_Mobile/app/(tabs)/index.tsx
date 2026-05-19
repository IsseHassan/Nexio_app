import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, Dimensions, Alert, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Image as ImageIcon, Mic, Sparkles, Package,
  ChevronRight, FileText, Share2, Megaphone, Hash, MicOff, X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useAdStore } from '../../src/store/adStore';
import { useAuth } from '../../src/auth/AuthContext';
import { loadHistory, loadKitFull, type KitEntry } from '../../src/services/historyService';
import { transcribeVoice } from '../../src/services/aiService';
import { analyzeProductQuick } from '../../src/services/analyzeService';
import { Image3DViewer } from '../../src/components/Image3DViewer';

const { width: SW } = Dimensions.get('window');

const BG    = '#EDE4DC';
const CARD  = '#FAF7F4';
const ACCENT = '#E8664A';
const TEXT1 = '#2B2B2B';
const TEXT2 = '#7A7A7A';
const TEXT3 = '#ADADAD';
const BORDER = '#E0DAD4';

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
  const { pickedImage, setPickedImage, setProductText, setGoal, productText } = useAdStore();
  const restoreKit = useAdStore(s => s.restoreKit);
  const { user } = useAuth();
  const [recentKits, setRecentKits] = useState<KitEntry[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('Full Kit');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => {
    loadHistory().then(h => setRecentKits(h.slice(0, 6)));
  }, []));

  useEffect(() => {
    if (micState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 550, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [micState]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setUploading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      quality: 0.5,
      base64: true,
    });
    setUploading(false);
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPickedImage({ base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg', uri: a.uri });
      setShow3D(false);
    }
  }

  async function analyzeImage() {
    if (!pickedImage?.base64) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${require('expo-constants').default.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080'}/api/generate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Look at this image and write a single professional description (2-3 sentences) that captures what it shows, its purpose, key visual elements, and tone. Write it as if briefing a designer or copywriter. Be specific and professional. Return only the description, no labels or JSON.`,
          image: { base64: pickedImage.base64, mimeType: pickedImage.mimeType },
        }),
      });
      const { text } = await res.json();
      if (text?.trim()) setDescription(text.trim());
    } catch {
      Alert.alert('Analysis failed', 'Could not analyze image. Please describe it manually.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function startMic() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission required', 'Allow microphone access in your device settings.'); return; }
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true }); } catch {}
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setMicState('recording');
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch (e: any) {
      Alert.alert('Could not start recording', e?.message ?? String(e));
    }
  }

  async function stopMic() {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setMicState('processing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
      const uri = recordingRef.current.getURI()!;
      recordingRef.current = null;
      const ext  = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const mime = ext === 'm4a' ? 'audio/m4a' : 'audio/mpeg';
      const b64  = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const transcript = await transcribeVoice(b64, mime);
      setDescription(transcript);
    } catch (e: any) {
      Alert.alert('Transcription failed', e?.message ?? 'Could not understand audio.');
    } finally {
      setMicState('idle');
    }
  }

  function toggleMic() {
    if (micState === 'idle') startMic();
    else if (micState === 'recording') stopMic();
  }

  function handleGenerate() {
    if (!pickedImage) { pickImage(); return; }
    setProductText(description);
    const goalMap: Record<string, any> = {
      'Full Kit': 'full', 'Photos': 'images', 'Listing': 'listing', 'Social': 'social',
    };
    setGoal(goalMap[selectedGoal] ?? 'full');
    router.push('/generate');
  }

  async function openKit(entry: KitEntry) {
    const full = await loadKitFull(entry.id);
    if (!full) return;
    restoreKit(full);
    router.push('/kit');
  }

  function kitProgress(kit: KitEntry): number {
    let done = 0;
    if (kit.imageCount > 0) done++;
    if (kit.hasListing) done++;
    if (kit.hasSocial) done++;
    return Math.round((done / 3) * 100);
  }

  const currentKit = recentKits[0] ?? null;
  const fmtDuration = `${Math.floor(recordDuration / 60)}:${String(recordDuration % 60).padStart(2, '0')}`;
  const CARD_SIZE = SW - 32;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
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

        {/* ── Create Card ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: CARD, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>

          {/* Image area */}
          {pickedImage ? (
            <View style={{ width: CARD_SIZE, height: CARD_SIZE * 0.62, backgroundColor: show3D ? '#161616' : '#E8DDD4', alignItems: 'center', justifyContent: 'center' }}>
              {show3D ? (
                <Image3DViewer imageUri={pickedImage.uri} size={CARD_SIZE * 0.58} />
              ) : (
                <Image source={{ uri: pickedImage.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}

              {/* Top action row */}
              <View style={{ position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                {/* Change photo */}
                <TouchableOpacity onPress={pickImage} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <ImageIcon size={13} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Change</Text>
                </TouchableOpacity>

                {/* 3D toggle */}
                <TouchableOpacity
                  onPress={() => setShow3D(v => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: show3D ? ACCENT : 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{show3D ? '3D ON' : '3D'}</Text>
                </TouchableOpacity>
              </View>

              {/* Remove */}
              <TouchableOpacity
                onPress={() => { setPickedImage(null); setShow3D(false); }}
                style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              style={{ width: CARD_SIZE, height: CARD_SIZE * 0.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EAE4' }}
            >
              {uploading ? (
                <ActivityIndicator color={ACCENT} size="large" />
              ) : (
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${ACCENT}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: `${ACCENT}40`, borderStyle: 'dashed' }}>
                    <ImageIcon size={28} color={ACCENT} strokeWidth={1.6} />
                  </View>
                  <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16 }}>Upload Product Photo</Text>
                  <Text style={{ color: TEXT2, fontSize: 12 }}>Tap to pick from gallery</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Description + voice row */}
          <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 10 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product (optional)…"
                placeholderTextColor={TEXT3}
                style={{ flex: 1, color: TEXT1, fontSize: 13.5, paddingVertical: 0 }}
                returnKeyType="done"
              />
              {description.length > 0 && (
                <TouchableOpacity onPress={() => setDescription('')} hitSlop={8}>
                  <X size={14} color={TEXT3} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleMic} disabled={micState === 'processing'} activeOpacity={0.8}>
                {micState === 'processing' ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : micState === 'recording' ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                    <MicOff size={15} color="#fff" strokeWidth={2} />
                  </Animated.View>
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${ACCENT}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${ACCENT}40` }}>
                    <Mic size={15} color={ACCENT} strokeWidth={2} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {micState === 'recording' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E84A4A' }} />
                <Text style={{ color: '#E84A4A', fontSize: 11, fontWeight: '600' }}>Recording {fmtDuration} — tap mic to stop</Text>
              </View>
            )}

            {/* Analyze with AI button — shown when image picked and no description yet */}
            {pickedImage && !analyzing && (
              <TouchableOpacity
                onPress={analyzeImage}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(232,102,74,0.1)', borderWidth: 1, borderColor: 'rgba(232,102,74,0.25)' }}
              >
                <Sparkles size={14} color={ACCENT} strokeWidth={1.8} />
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>Analyze image — generate prompt</Text>
              </TouchableOpacity>
            )}
            {analyzing && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 10 }}>
                <ActivityIndicator size="small" color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Analyzing your image…</Text>
              </View>
            )}
          </View>

          {/* Generate button */}
          <View style={{ padding: 14, paddingTop: 10 }}>
            <TouchableOpacity onPress={handleGenerate} activeOpacity={0.85}>
              <LinearGradient
                colors={['#F07848', ACCENT]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 }}
              >
                <Sparkles size={17} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {pickedImage ? 'Generate Kit' : 'Upload & Generate'}
                </Text>
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
            {currentKit.thumbnailUrl ? (
              <Image source={{ uri: currentKit.thumbnailUrl }} style={{ width: 58, height: 58, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 58, height: 58, borderRadius: 12, backgroundColor: '#E8E0D8', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} color={TEXT3} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 14, marginBottom: 3 }} numberOfLines={1}>{currentKit.name}</Text>
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 9 }}>In progress</Text>
              <View style={{ height: 4, backgroundColor: '#E0D8D0', borderRadius: 2 }}>
                <View style={{ height: 4, width: `${kitProgress(currentKit)}%`, backgroundColor: ACCENT, borderRadius: 2 }} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22 }}>{kitProgress(currentKit)}%</Text>
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
                  {kit.thumbnailUrl ? (
                    <Image source={{ uri: kit.thumbnailUrl }} style={{ width: 148, height: 148 }} resizeMode="cover" />
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
    </KeyboardAvoidingView>
  );
}
