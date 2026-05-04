import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Download, Share2, X } from 'lucide-react-native';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveImageToPhotos, shareImage } from '../src/services/imageService';
import { useAdStore } from '../src/store/adStore';

const { width } = Dimensions.get('window');

export default function PreviewScreen() {
  const { variationId } = useLocalSearchParams<{ variationId: string }>();
  const { variations } = useAdStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const variation = variations.find((v) => v.id === variationId);

  if (!variation || !variation.imageUrl) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-zinc-400">Image not available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-9 h-9 rounded-full bg-zinc-800/80 items-center justify-center"
        >
          <X size={18} color="#fff" />
        </Pressable>
        <View className="items-center">
          <Text className="text-white font-semibold text-sm">{variation.label}</Text>
          <Text className="text-zinc-500 text-xs">{variation.description}</Text>
        </View>
        <View className="w-9" />
      </View>

      <View className="flex-1 items-center justify-center">
        <Image
          source={{ uri: variation.imageUrl }}
          style={{ width, height: width }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-row gap-3 px-6 py-4">
        <Pressable
          onPress={() => shareImage(variation.imageUrl!, variation.label)}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700"
        >
          <Share2 size={18} color="#a1a1aa" />
          <Text className="text-zinc-300 font-semibold">Share</Text>
        </Pressable>
        <Pressable
          onPress={() => saveImageToPhotos(variation.imageUrl!, variation.label)}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600"
        >
          <Download size={18} color="#fff" />
          <Text className="text-white font-semibold">Save to Photos</Text>
        </Pressable>
      </View>
    </View>
  );
}
