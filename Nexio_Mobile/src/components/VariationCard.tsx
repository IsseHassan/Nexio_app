import { AlertCircle, Download, Expand } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, Text, View } from 'react-native';
import { AdVariation } from '../constants';
import { saveImageToPhotos } from '../services/imageService';
import { useAdStore } from '../store/adStore';

interface Props {
  variation: AdVariation;
  onPreview: (variation: AdVariation) => void;
}

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  amazon:    { bg: 'rgba(255,153,0,0.9)',  border: '#ff9900', text: '#000' },
  instagram: { bg: 'rgba(225,48,108,0.9)', border: '#e1306c', text: '#fff' },
  etsy:      { bg: 'rgba(245,100,0,0.9)',  border: '#f56400', text: '#fff' },
  tiktok:    { bg: 'rgba(1,1,1,0.9)',      border: '#69c9d0', text: '#fff' },
};

export function VariationCard({ variation, onPreview }: Props) {
  const imageScores = useAdStore(s => s.imageScores);
  const overallBestType = useAdStore(s => s.overallBestType);

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variation.status === 'generating') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmerAnim.stopAnimation();
    }
  }, [variation.status]);

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  const score = imageScores?.[variation.type];
  const isOverallBest = !!overallBestType && overallBestType === variation.type;
  const topPlatform = !isOverallBest ? score?.best_for?.[0] : undefined;
  const showBadge = variation.status === 'completed' && !!score && (isOverallBest || !!topPlatform);
  const badgeColors = topPlatform ? (PLATFORM_COLORS[topPlatform] ?? { bg: 'rgba(39,39,42,0.9)', border: '#3f3f46', text: '#a1a1aa' }) : null;

  return (
    <View style={{ flex: 1, margin: 6, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#CFCBC7', backgroundColor: '#F6F2EE' }}>
      <View className="aspect-square">
        {variation.status === 'completed' && variation.imageUrl ? (
          <>
            <Image
              source={{ uri: variation.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {showBadge && (
              <View style={{
                position: 'absolute', top: 6, left: 6,
                backgroundColor: isOverallBest ? 'rgba(215,135,106,0.92)' : badgeColors!.bg,
                borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
                borderWidth: 1, borderColor: isOverallBest ? '#E8664A' : badgeColors!.border,
              }}>
                <Text style={{
                  color: isOverallBest ? '#fff' : badgeColors!.text,
                  fontSize: 8, fontWeight: '800', letterSpacing: 0.4,
                }}>
                  {isOverallBest ? '★ BEST' : topPlatform!.toUpperCase()}
                </Text>
              </View>
            )}
          </>
        ) : variation.status === 'error' ? (
          <View className="w-full h-full items-center justify-center bg-red-950/30 gap-2">
            <AlertCircle size={28} color="#f87171" />
            <Text className="text-red-400 text-xs text-center px-2">Generation failed</Text>
          </View>
        ) : (
          <Animated.View
            style={{ opacity: shimmerOpacity }}
            style={{ width: '100%', height: '100%', backgroundColor: '#E8E0D8', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <ActivityIndicator size="small" color="#E8664A" />
            <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Generating...</Text>
          </Animated.View>
        )}
      </View>

      <View className="p-2">
        <Text style={{ color: '#2B2B2B', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
          {variation.label}
        </Text>
        <Text style={{ color: '#7A7A7A', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {variation.description}
        </Text>

        {variation.status === 'completed' && variation.imageUrl && (
          <View className="flex-row gap-1.5 mt-2">
            <Pressable
              onPress={() => onPreview(variation)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E8E0D8' }}
            >
              <Expand size={12} color="#7A7A7A" />
              <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Preview</Text>
            </Pressable>
            <Pressable
              onPress={() => saveImageToPhotos(variation.imageUrl!, variation.label)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(215,135,106,0.12)', borderWidth: 1, borderColor: 'rgba(215,135,106,0.3)' }}
            >
              <Download size={12} color="#E8664A" />
              <Text style={{ color: '#E8664A', fontSize: 12 }}>Save</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
