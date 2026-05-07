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
      <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#CFCBC7', position: 'relative' }}>
        <Image
          source={{ uri: pickedImage.uri }}
          className="w-full h-52"
          resizeMode="cover"
        />
        <Pressable
          onPress={() => setPickedImage(null)}
          style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(43,43,43,0.6)', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color="#fff" />
        </Pressable>
        <Pressable
          onPress={showPicker}
          style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(43,43,43,0.6)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <ImagePlus size={14} color="#F6F2EE" />
          <Text style={{ color: '#F6F2EE', fontSize: 12, fontWeight: '500' }}>Change</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={showPicker}
      style={{ marginHorizontal: 16, height: 176, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CFCBC7', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(246,242,238,0.8)' }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(215,135,106,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Camera size={28} color="#E8664A" />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ color: '#2B2B2B', fontWeight: '600', fontSize: 16 }}>Upload Product Photo</Text>
        <Text style={{ color: '#7A7A7A', fontSize: 14 }}>Tap to choose from camera or library</Text>
      </View>
    </Pressable>
  );
}
