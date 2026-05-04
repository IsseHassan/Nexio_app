import { router } from 'expo-router';
import {
  ChevronDown, ChevronUp, Sparkles,
  Image as ImageIcon, FileText, Tag, ShoppingBag, Hash, Music,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../src/components/AppHeader';
import { CategoryList } from '../src/components/CategoryList';
import { ImageUploadButton } from '../src/components/ImageUploadButton';
import { useAdStore } from '../src/store/adStore';
import type { Language, Tone, ListingLength } from '../src/services/listingService';

function OptionPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={{
            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
            backgroundColor: value === opt ? '#4f46e5' : 'transparent',
            borderColor: value === opt ? '#4f46e5' : '#3f3f46',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: value === opt ? '#fff' : '#71717a', textTransform: 'capitalize' }}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const KIT_PREVIEWS = [
  { Icon: ImageIcon, label: '6 Images' },
  { Icon: FileText,  label: 'Listing' },
  { Icon: Tag,       label: 'Etsy' },
  { Icon: ShoppingBag, label: 'Amazon' },
  { Icon: Hash,      label: 'Instagram' },
  { Icon: Music,     label: 'TikTok' },
];

export default function HomeScreen() {
  const {
    pickedImage, selectedCategory, setCategory,
    listingLanguage, listingTone, listingLength,
    setListingLanguage, setListingTone, setListingLength,
  } = useAdStore();
  const insets = useSafeAreaInsets();
  const [optionsOpen, setOptionsOpen] = useState(false);

  function handleGenerate() {
    if (!pickedImage) return;
    router.push('/generate');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: insets.top }}>
      <AppHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 34 }}>
            AI Product{'\n'}
            <Text style={{ color: '#818cf8' }}>Generator</Text>
          </Text>
          <Text style={{ color: '#71717a', fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            Upload a product photo and get 6 ad images + a complete product kit ready to sell.
          </Text>
        </View>

        <ImageUploadButton />

        <CategoryList selected={selectedCategory} onSelect={setCategory} />

        {/* Listing options (collapsible) */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={() => setOptionsOpen(o => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#18181b', borderRadius: 12, borderWidth: 1, borderColor: '#27272a' }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#71717a', fontSize: 13, fontWeight: '500' }}>Listing Options</Text>
            {optionsOpen
              ? <ChevronUp size={16} color="#52525b" />
              : <ChevronDown size={16} color="#52525b" />}
          </TouchableOpacity>

          {optionsOpen && (
            <View style={{ marginTop: 14, gap: 16 }}>
              <View>
                <Text style={{ color: '#52525b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Language</Text>
                <OptionPills
                  options={['English', 'Turkish', 'Spanish', 'German'] as Language[]}
                  value={listingLanguage}
                  onChange={setListingLanguage}
                />
              </View>
              <View>
                <Text style={{ color: '#52525b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Tone</Text>
                <OptionPills
                  options={['professional', 'luxury', 'casual', 'fun'] as Tone[]}
                  value={listingTone}
                  onChange={setListingTone}
                />
              </View>
              <View>
                <Text style={{ color: '#52525b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Length</Text>
                <OptionPills
                  options={['short', 'medium', 'long'] as ListingLength[]}
                  value={listingLength}
                  onChange={setListingLength}
                />
              </View>
            </View>
          )}
        </View>

        {/* Generate CTA */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={!pickedImage}
            style={{
              alignItems: 'center', justifyContent: 'center', gap: 4,
              paddingVertical: 18, borderRadius: 16,
              backgroundColor: pickedImage ? '#4f46e5' : '#18181b',
              opacity: pickedImage ? 1 : 0.5,
              shadowColor: '#4f46e5', shadowOpacity: pickedImage ? 0.4 : 0, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color={pickedImage ? '#fff' : '#52525b'} />
              <Text style={{ color: pickedImage ? '#fff' : '#52525b', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}>
                Generate Product Kit
              </Text>
            </View>
            <Text style={{ color: pickedImage ? 'rgba(255,255,255,0.6)' : '#3f3f46', fontSize: 11 }}>
              Images + Listing + Platform Content
            </Text>
          </TouchableOpacity>
          {!pickedImage && (
            <Text style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Upload a product image to get started
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom kit preview bar ── */}
      <View style={{ borderTopWidth: 1, borderColor: '#1c1c1f', backgroundColor: '#09090b', paddingBottom: insets.bottom || 12 }}>
        <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
          {KIT_PREVIEWS.map(({ Icon, label }) => (
            <View key={label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Icon size={17} color="#3f3f46" />
              <Text style={{ color: '#3f3f46', fontSize: 9, fontWeight: '600', letterSpacing: 0.3 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
