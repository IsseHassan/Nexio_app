import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { PickedImage } from '../store/adStore';

export function useImagePicker() {
  async function pickFromGallery(): Promise<PickedImage | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]?.base64) return null;
    const asset = result.assets[0];
    return {
      base64: asset.base64!,
      mimeType: (asset.mimeType as string) ?? 'image/jpeg',
      uri: asset.uri,
    };
  }

  async function pickFromCamera(): Promise<PickedImage | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.base64) return null;
    const asset = result.assets[0];
    return {
      base64: asset.base64!,
      mimeType: (asset.mimeType as string) ?? 'image/jpeg',
      uri: asset.uri,
    };
  }

  return { pickFromGallery, pickFromCamera };
}
