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
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(43,43,43,0.6)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} color="#fff" />
        </Pressable>
        <View className="items-center">
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{variation.label}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{variation.description}</Text>
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
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(246,242,238,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <Share2 size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Share</Text>
        </Pressable>
        <Pressable
          onPress={() => saveImageToPhotos(variation.imageUrl!, variation.label)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#E8664A' }}
        >
          <Download size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Save to Photos</Text>
        </Pressable>
      </View>
    </View>
  );
}
