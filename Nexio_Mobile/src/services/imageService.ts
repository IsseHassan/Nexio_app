import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

function extractBase64(dataUri: string): string {
  return dataUri.startsWith('data:') ? dataUri.split(',')[1] : dataUri;
}

async function writeToCache(base64: string, label: string): Promise<string> {
  const fileUri = `${FileSystem.cacheDirectory}adgenius-${label}-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

export async function saveImageToPhotos(dataUri: string, label: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Please allow access to your photo library.');
    return;
  }

  const fileUri = await writeToCache(extractBase64(dataUri), label);
  await MediaLibrary.saveToLibraryAsync(fileUri);
  Alert.alert('Saved', 'Image saved to your photo library.');
}

export async function shareImage(dataUri: string, label: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
    return;
  }

  const fileUri = await writeToCache(extractBase64(dataUri), label);
  await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: `Share ${label}` });
}

export async function saveAllImages(
  images: { dataUri: string; label: string }[]
): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Please allow access to your photo library.');
    return;
  }

  for (const { dataUri, label } of images) {
    const fileUri = await writeToCache(extractBase64(dataUri), label);
    await MediaLibrary.saveToLibraryAsync(fileUri);
  }
  Alert.alert('Saved', `${images.length} images saved to your photo library.`);
}
