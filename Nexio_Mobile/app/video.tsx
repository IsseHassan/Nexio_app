import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ImagePlus, RefreshCw, Sparkles, Play } from 'lucide-react-native';
import { cacheProductImage, generateVideo } from '../src/services/aiService';

const BG      = '#EDE4DC';
const CARD    = '#F6F2EE';
const BORDER  = '#CFCBC7';
const PRIMARY = '#E8664A';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';

const STYLES = [
  { label: 'Studio', prompt: 'Smooth 360° rotation on clean white studio background, professional product shot' },
  { label: 'Luxury', prompt: 'Slow cinematic reveal with dark moody background, premium dramatic lighting' },
  { label: 'Lifestyle', prompt: 'Product placed in a cozy home setting, natural light, lifestyle photography' },
  { label: 'Dynamic', prompt: 'Fast dynamic zoom with motion blur, bold energy, social media style' },
];

export default function VideoScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setImage({ uri: asset.uri, base64: asset.base64 ?? '', mimeType: asset.mimeType ?? 'image/jpeg' });
    setVideoUrl(null);
  }

  async function handleGenerate() {
    if (!image) { Alert.alert('Add product photo', 'Upload a product image to generate the video.'); return; }
    const p = prompt.trim();
    if (!p) { Alert.alert('Add a style', 'Pick a style or describe the video scene.'); return; }
    setGenerating(true);
    setVideoUrl(null);
    try {
      const sessionId = await cacheProductImage(image.base64, image.mimeType);
      const url = await generateVideo(p, sessionId);
      setVideoUrl(url);
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not generate video. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color={TEXT1} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: TEXT1, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>Product Video</Text>
          <Text style={{ color: TEXT3, fontSize: 12 }}>Veo 2 · 15–30 sec</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Product image — hero */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={{ marginBottom: 20 }}>
          {image ? (
            <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' }}>
              <Image source={{ uri: image.uri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)' }} />
              <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Product photo ready</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Change</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ height: 200, borderRadius: 22, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <ImagePlus size={26} color={PRIMARY} strokeWidth={1.6} />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>Add product photo</Text>
                <Text style={{ color: TEXT3, fontSize: 13 }}>The AI will animate your product</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Style chips */}
        <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Video Style</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {STYLES.map((s) => {
            const selected = prompt === s.prompt;
            return (
              <TouchableOpacity
                key={s.label}
                onPress={() => setPrompt(selected ? '' : s.prompt)}
                activeOpacity={0.8}
                style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: selected ? PRIMARY : BORDER, backgroundColor: selected ? 'rgba(232,102,74,0.08)' : CARD }}
              >
                <Text style={{ color: selected ? PRIMARY : TEXT2, fontSize: 14, fontWeight: selected ? '700' : '500' }}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom prompt */}
        <View style={{ backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Custom prompt</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Or describe your own scene, movement, lighting…"
            placeholderTextColor={TEXT3}
            multiline
            style={{ color: TEXT1, fontSize: 14, lineHeight: 22, minHeight: 60 }}
          />
        </View>

        {/* Generate */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
          style={{ backgroundColor: generating ? BORDER : PRIMARY, borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginBottom: 24 }}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Generating… 15–30 sec</Text>
            </>
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Generate Video</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {videoUrl && (
          <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: '#000', marginBottom: 16 }}>
            <Video
              source={{ uri: videoUrl }}
              style={{ width: '100%', height: 320 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
            />
            <TouchableOpacity
              onPress={handleGenerate}
              style={{ margin: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)' }}
              activeOpacity={0.7}
            >
              <Play size={14} color="#fff" fill="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Generate again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
