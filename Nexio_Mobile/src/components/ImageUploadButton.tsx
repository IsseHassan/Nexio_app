import { Camera, ImagePlus, X } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useImagePicker } from '../hooks/useImagePicker';
import { PickedImage, useAdStore } from '../store/adStore';

interface Props {
  onPicked?: (img: PickedImage) => void;
}

export function ImageUploadButton({ onPicked }: Props) {
  const { pickedImage, setPickedImage } = useAdStore();
  const { pickFromGallery, pickFromCamera } = useImagePicker();

  function showPicker() {
    Alert.alert('Select Image', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const img = await pickFromCamera();
          if (img) {
            setPickedImage(img);
            onPicked?.(img);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const img = await pickFromGallery();
          if (img) {
            setPickedImage(img);
            onPicked?.(img);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (pickedImage) {
    return (
      <View className="mx-4 rounded-2xl overflow-hidden border border-zinc-700 relative">
        <Image
          source={{ uri: pickedImage.uri }}
          className="w-full h-52"
          resizeMode="cover"
        />
        <Pressable
          onPress={() => setPickedImage(null)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-zinc-900/80 items-center justify-center"
        >
          <X size={16} color="#fff" />
        </Pressable>
        <Pressable
          onPress={showPicker}
          className="absolute bottom-2 right-2 flex-row items-center gap-1.5 bg-zinc-900/80 rounded-lg px-3 py-1.5"
        >
          <ImagePlus size={14} color="#a1a1aa" />
          <Text className="text-zinc-300 text-xs font-medium">Change</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={showPicker}
      className="mx-4 h-44 rounded-2xl border-2 border-dashed border-zinc-600 items-center justify-center gap-3 bg-zinc-800/30"
    >
      <View className="w-14 h-14 rounded-2xl bg-zinc-700/50 items-center justify-center">
        <Camera size={28} color="#6366f1" />
      </View>
      <View className="items-center gap-1">
        <Text className="text-white font-semibold text-base">Upload Product Photo</Text>
        <Text className="text-zinc-500 text-sm">Tap to choose from camera or library</Text>
      </View>
    </Pressable>
  );
}
