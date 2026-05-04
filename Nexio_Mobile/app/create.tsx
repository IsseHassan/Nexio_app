import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  X, Upload, ChevronRight, Star,
  Image as ImageIcon, FileText, Hash, Package,
  Sofa, Gem, Smartphone, Shirt, ShoppingBag,
  Sparkles, Coffee, Home, Heart, Scissors, Dumbbell, BookOpen, Gift, Lamp, Palette,
} from 'lucide-react-native';
import { useAdStore, type GenerationGoal } from '../src/store/adStore';
import { CATEGORIES } from '../src/constants';

const BG      = '#0B0B0F';
const CARD    = '#131320';
const BORDER  = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1   = '#FFFFFF';
const TEXT2   = '#8B8BA7';
const TEXT3   = '#3A3A52';

const CAT_ICONS: Record<string, any> = {
  Sofa, Gem, Smartphone, Shirt, Package,
  Sparkles, Coffee, Home, Heart, Scissors, Dumbbell, BookOpen, Gift, Lamp, Palette,
};

const GOALS = [
  { id: 'full',    label: 'Full Product Kit',  desc: 'Images, listing, social content and export files', Icon: Star,      recommended: true },
  { id: 'images',  label: 'Only Images',        desc: 'Generate beautiful product images',                Icon: ImageIcon, recommended: false },
  { id: 'listing', label: 'Only Listing',       desc: 'Generate listing content for marketplaces',        Icon: FileText,  recommended: false },
  { id: 'social',  label: 'Social Media Pack',  desc: 'Get captions, hashtags and social content',        Icon: Hash, recommended: false },
];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { pickedImage, selectedCategory, setPickedImage, setCategory, setGoal } = useAdStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoal, setSelectedGoal] = useState('full');
  const [uploading, setUploading] = useState(false);

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
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setPickedImage({ base64: asset.base64!, mimeType, uri: asset.uri });
    }
  }

  function handleContinue() {
    if (step === 1) {
      if (!pickedImage) return;
      setStep(2);
    } else {
      setGoal(selectedGoal as GenerationGoal);
      router.replace('/generate');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => { if (step === 2) setStep(1); else router.back(); }}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={TEXT2} />
        </TouchableOpacity>
        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 16 }}>Create New Kit</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step indicator */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 24 }}>
        {[1, 2].map(s => (
          <View key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: s <= step ? PRIMARY : BORDER }} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
              1. Upload Product Photo
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 20 }}>Upload a clear photo of your product</Text>

            {/* Upload area */}
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}
              style={{
                height: 200, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: pickedImage ? PRIMARY : BORDER,
                backgroundColor: pickedImage ? 'rgba(92,59,229,0.06)' : CARD,
                alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden',
              }}>
              {uploading
                ? <ActivityIndicator color={PRIMARY} />
                : pickedImage
                  ? <Image source={{ uri: pickedImage.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  : (
                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(92,59,229,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={24} color={PRIMARY} />
                      </View>
                      <Text style={{ color: TEXT1, fontWeight: '600', fontSize: 15 }}>Tap to upload</Text>
                      <Text style={{ color: TEXT3, fontSize: 12 }}>or drag and drop</Text>
                      <Text style={{ color: TEXT3, fontSize: 11 }}>JPG, PNG up to 20MB</Text>
                    </View>
                  )
              }
            </TouchableOpacity>

            {/* Category */}
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
              2. Select Category
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 16 }}>What type of product is this?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CATEGORIES.map(cat => {
                const Icon = CAT_ICONS[cat.icon] || ShoppingBag;
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id as any)} activeOpacity={0.8}
                    style={{
                      width: '30%', aspectRatio: 1, borderRadius: 16,
                      backgroundColor: active ? 'rgba(92,59,229,0.15)' : CARD,
                      borderWidth: 1.5, borderColor: active ? PRIMARY : BORDER,
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: active ? 'rgba(92,59,229,0.2)' : '#1E1E2E', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={active ? PRIMARY : TEXT3} />
                    </View>
                    <Text style={{ color: active ? TEXT1 : TEXT2, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <Text style={{ color: TEXT1, fontWeight: '800', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
              2. Choose Your Goal
            </Text>
            <Text style={{ color: TEXT2, fontSize: 13, marginBottom: 20 }}>What do you want to create?</Text>
            <View style={{ gap: 10 }}>
              {GOALS.map(({ id, label, desc, Icon, recommended }) => {
                const active = selectedGoal === id;
                return (
                  <TouchableOpacity key={id} onPress={() => setSelectedGoal(id)} activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18,
                      backgroundColor: active ? 'rgba(92,59,229,0.12)' : CARD,
                      borderWidth: 1.5, borderColor: active ? PRIMARY : BORDER,
                    }}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: active ? 'rgba(92,59,229,0.2)' : '#1E1E2E', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={active ? PRIMARY : TEXT2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 15 }}>{label}</Text>
                        {recommended && (
                          <View style={{ backgroundColor: PRIMARY, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>Recommended</Text>
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
        <TouchableOpacity onPress={handleContinue}
          disabled={step === 1 && !pickedImage}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 17, borderRadius: 16,
            backgroundColor: step === 1 && !pickedImage ? CARD : PRIMARY,
            opacity: step === 1 && !pickedImage ? 0.5 : 1,
            shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
          }}>
          <Text style={{ color: step === 1 && !pickedImage ? TEXT3 : '#fff', fontWeight: '700', fontSize: 16 }}>Continue</Text>
          <ChevronRight size={18} color={step === 1 && !pickedImage ? TEXT3 : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
