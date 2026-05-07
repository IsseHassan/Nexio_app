import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, TextInput, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import {
  X, ChevronRight, Star, Image as ImageIcon, FileText, Hash, Package,
  Sofa, Gem, Smartphone, Shirt, ShoppingBag, Sparkles, Coffee, Home,
  Heart, Scissors, Dumbbell, BookOpen, Gift, Lamp, Palette,
  Video, Mic, MicOff, Plus, Trash2,
} from 'lucide-react-native';
import { useAdStore, type GenerationGoal } from '../src/store/adStore';
import { CATEGORIES } from '../src/constants';
import { transcribeVoice, analyzeVideoDescription } from '../src/services/aiService';

const BG      = '#EDE4DC';
const CARD    = '#F6F2EE';
const BORDER  = '#CFCBC7';
const PRIMARY = '#E8664A';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';

const CAT_ICONS: Record<string, any> = {
  Sofa, Gem, Smartphone, Shirt, Package,
  Sparkles, Coffee, Home, Heart, Scissors, Dumbbell, BookOpen, Gift, Lamp, Palette,
};

const GOALS = [
  { id: 'full',    label: 'Full Product Kit',  desc: 'Images, listing, social content and export files', Icon: Star,      recommended: true  },
  { id: 'images',  label: 'Only Images',        desc: 'Generate beautiful product images',                Icon: ImageIcon, recommended: false },
  { id: 'listing', label: 'Only Listing',       desc: 'Generate listing content for marketplaces',        Icon: FileText,  recommended: false },
  { id: 'social',  label: 'Social Media Pack',  desc: 'Captions, hashtags and social content',            Icon: Hash,      recommended: false },
];

type RecordState = 'idle' | 'recording' | 'processing';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const {
    pickedImage, angleImages, videoAsset, mediaType, productText, voiceTranscript,
    selectedCategory,
    setPickedImage, addAngleImage, removeAngleImage, setAngleImages,
    setVideoAsset, setMediaType, setProductText, setVoiceTranscript,
    setCategory, setGoal,
  } = useAdStore();

  const [step, setStep]               = useState<1 | 2>(1);
  const [selectedGoal, setSelectedGoal] = useState('full');
  const [uploading, setUploading]     = useState(false);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recordState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordState]);

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
    }
  }

  async function pickAngleImage() {
    if (angleImages.length >= 3) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      addAngleImage({ base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg', uri: a.uri });
    }
  }

  async function pickVideo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    setUploading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as any,
      quality: 0.5,
    });
    setUploading(false);
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      const name = a.uri.split('/').pop() ?? 'video.mp4';
      setVideoAsset({ uri: a.uri, mimeType: a.mimeType ?? 'video/mp4', name });
    }
  }

  async function analyzeVideo() {
    if (!videoAsset) return;
    setAnalyzingVideo(true);
    try {
      const desc = await analyzeVideoDescription(videoAsset.uri);
      setProductText(desc);
    } catch (e: any) {
      Alert.alert('Analysis failed', e.message ?? 'Could not analyze video');
    } finally {
      setAnalyzingVideo(false);
    }
  }

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission required', 'Allow microphone access to record voice.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setRecordState('recording');
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch (e: any) {
      Alert.alert('Recording failed', e.message ?? 'Could not start recording');
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordState('processing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI()!;
      const ext  = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const mime = ext === 'm4a' ? 'audio/m4a' : ext === 'amr' ? 'audio/amr' : 'audio/mpeg';
      const b64  = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const transcript = await transcribeVoice(b64, mime);
      setVoiceTranscript(transcript);
      setProductText(transcript);
    } catch (e: any) {
      Alert.alert('Transcription failed', e.message ?? 'Could not process recording');
    } finally {
      recordingRef.current = null;
      setRecordState('idle');
    }
  }

  function toggleRecording() {
    if (recordState === 'idle') startRecording();
    else if (recordState === 'recording') stopRecording();
  }

  function handleContinue() {
    if (step === 1) {
      const hasMedia = mediaType === 'photo' ? !!pickedImage : !!videoAsset;
      if (!hasMedia && !productText.trim()) return;
      setStep(2);
    } else {
      setGoal(selectedGoal as GenerationGoal);
      router.replace('/generate');
    }
  }

  const hasMedia = mediaType === 'photo' ? !!pickedImage : !!videoAsset;
  const canContinue = step === 1 ? (hasMedia || productText.trim().length > 0) : true;
  const fmtDuration = `${Math.floor(recordDuration / 60)}:${String(recordDuration % 60).padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
        <TouchableOpacity
          onPress={() => { if (step === 2) setStep(1); else router.back(); }}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color={TEXT2} />
        </TouchableOpacity>
        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16 }}>Create New Kit</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step bar */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 24 }}>
        {[1, 2].map(s => (
          <View key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: s <= step ? PRIMARY : BORDER }} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {step === 1 && (
          <>
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
              Upload your product
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 18 }}>
              Add a photo, video, or describe it with text or voice
            </Text>

            {/* Media type tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: CARD, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: BORDER }}>
              {(['photo', 'video'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setMediaType(t)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 6, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: mediaType === t ? PRIMARY : 'transparent',
                  }}
                >
                  {t === 'photo'
                    ? <ImageIcon size={15} color={mediaType === t ? '#fff' : TEXT2} strokeWidth={2} />
                    : <Video     size={15} color={mediaType === t ? '#fff' : TEXT2} strokeWidth={2} />
                  }
                  <Text style={{ color: mediaType === t ? '#fff' : TEXT2, fontSize: 13, fontWeight: '600' }}>
                    {t === 'photo' ? 'Photo' : 'Video'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Photo mode ── */}
            {mediaType === 'photo' && (
              <>
                <TouchableOpacity
                  onPress={pickImage}
                  activeOpacity={0.8}
                  style={{
                    height: 200, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: pickedImage ? PRIMARY : BORDER,
                    backgroundColor: pickedImage ? 'rgba(232,102,74,0.06)' : CARD,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden',
                  }}
                >
                  {uploading
                    ? <ActivityIndicator color={PRIMARY} />
                    : pickedImage
                      ? <Image source={{ uri: pickedImage.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      : (
                        <View style={{ alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(232,102,74,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={24} color={PRIMARY} strokeWidth={1.7} />
                          </View>
                          <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 15 }}>Tap to upload photo</Text>
                          <Text style={{ color: TEXT3, fontSize: 12 }}>JPG, PNG up to 20MB</Text>
                        </View>
                      )
                  }
                </TouchableOpacity>

                {/* Additional angles */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: TEXT2, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>
                    Add more angles (optional)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {angleImages.map((img, idx) => (
                      <View key={idx} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                        <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => removeAngleImage(idx)}
                          style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={10} color="#fff" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {angleImages.length < 3 && (
                      <TouchableOpacity
                        onPress={pickAngleImage}
                        activeOpacity={0.8}
                        style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: BORDER, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={20} color={TEXT3} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* ── Video mode ── */}
            {mediaType === 'video' && (
              <>
                <TouchableOpacity
                  onPress={pickVideo}
                  activeOpacity={0.8}
                  style={{
                    height: 200, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: videoAsset ? PRIMARY : BORDER,
                    backgroundColor: videoAsset ? 'rgba(232,102,74,0.06)' : CARD,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden',
                  }}
                >
                  {uploading
                    ? <ActivityIndicator color={PRIMARY} />
                    : videoAsset
                      ? (
                        <View style={{ alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(232,102,74,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={26} color={PRIMARY} strokeWidth={1.7} />
                          </View>
                          <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                            {videoAsset.name ?? 'Video selected'}
                          </Text>
                          <Text style={{ color: TEXT2, fontSize: 12 }}>Tap to change</Text>
                        </View>
                      )
                      : (
                        <View style={{ alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(232,102,74,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={24} color={PRIMARY} strokeWidth={1.7} />
                          </View>
                          <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 15 }}>Select video</Text>
                          <Text style={{ color: TEXT3, fontSize: 12 }}>MP4, MOV up to 500MB</Text>
                        </View>
                      )
                  }
                </TouchableOpacity>

                {videoAsset && (
                  <TouchableOpacity
                    onPress={analyzeVideo}
                    disabled={analyzingVideo}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(232,102,74,0.1)', borderWidth: 1, borderColor: 'rgba(232,102,74,0.3)', marginBottom: 16 }}
                  >
                    {analyzingVideo
                      ? <ActivityIndicator size="small" color={PRIMARY} />
                      : <Sparkles size={16} color={PRIMARY} strokeWidth={1.8} />
                    }
                    <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>
                      {analyzingVideo ? 'Analyzing video…' : 'Analyze with AI'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Description + voice record */}
            <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 }}>
                <TextInput
                  value={productText}
                  onChangeText={setProductText}
                  placeholder="Describe your product (optional)…"
                  placeholderTextColor={TEXT3}
                  multiline
                  numberOfLines={3}
                  style={{ flex: 1, color: TEXT1, fontSize: 14, lineHeight: 20, minHeight: 60, paddingTop: 0 }}
                />
                <TouchableOpacity
                  onPress={toggleRecording}
                  disabled={recordState === 'processing'}
                  activeOpacity={0.8}
                  style={{ marginTop: 2 }}
                >
                  {recordState === 'processing' ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                  ) : recordState === 'recording' ? (
                    <Animated.View style={{
                      transform: [{ scale: pulseAnim }],
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: '#E8664A',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MicOff size={16} color="#fff" strokeWidth={2} />
                    </Animated.View>
                  ) : (
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,102,74,0.3)' }}>
                      <Mic size={16} color={PRIMARY} strokeWidth={2} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {recordState === 'recording' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E84A4A' }} />
                  <Text style={{ color: '#E84A4A', fontSize: 12, fontWeight: '600' }}>Recording {fmtDuration}</Text>
                  <Text style={{ color: TEXT3, fontSize: 12 }}>— tap mic to stop</Text>
                </View>
              )}

              {voiceTranscript.length > 0 && recordState === 'idle' && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>Voice transcript</Text>
                    <Text style={{ color: TEXT2, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>{voiceTranscript}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setVoiceTranscript(''); setProductText(''); }} style={{ padding: 2 }}>
                    <X size={14} color={TEXT3} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category */}
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 18, letterSpacing: -0.4, marginBottom: 4 }}>
              Select Category
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 16 }}>What type of product is this?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CATEGORIES.map(cat => {
                const Icon   = CAT_ICONS[cat.icon] || ShoppingBag;
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id as any)}
                    activeOpacity={0.8}
                    style={{
                      width: '30%', aspectRatio: 1, borderRadius: 16,
                      backgroundColor: active ? 'rgba(232,102,74,0.12)' : CARD,
                      borderWidth: 1.5, borderColor: active ? PRIMARY : BORDER,
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: active ? 'rgba(232,102,74,0.2)' : '#E8E0D8', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={active ? PRIMARY : TEXT3} />
                    </View>
                    <Text style={{ color: active ? TEXT1 : TEXT2, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Step 2: Goal ── */}
        {step === 2 && (
          <>
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
              Choose your goal
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 20 }}>What do you want to create?</Text>
            <View style={{ gap: 10 }}>
              {GOALS.map(({ id, label, desc, Icon, recommended }) => {
                const active = selectedGoal === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setSelectedGoal(id)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18,
                      backgroundColor: active ? 'rgba(232,102,74,0.1)' : CARD,
                      borderWidth: 1.5, borderColor: active ? PRIMARY : BORDER,
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: active ? 'rgba(232,102,74,0.2)' : '#E8E0D8', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={active ? PRIMARY : TEXT2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>{label}</Text>
                        {recommended && (
                          <View style={{ backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>Best</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: TEXT2, fontSize: 12, lineHeight: 18 }}>{desc}</Text>
                    </View>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                      borderColor: active ? PRIMARY : TEXT3,
                      backgroundColor: active ? PRIMARY : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: BG }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 17, borderRadius: 16,
            backgroundColor: canContinue ? PRIMARY : CARD,
            opacity: canContinue ? 1 : 0.5,
            shadowColor: PRIMARY, shadowOpacity: canContinue ? 0.4 : 0, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ color: canContinue ? '#fff' : TEXT3, fontWeight: '700', fontSize: 16 }}>
            {step === 1 ? 'Continue' : 'Generate'}
          </Text>
          <ChevronRight size={18} color={canContinue ? '#fff' : TEXT3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
