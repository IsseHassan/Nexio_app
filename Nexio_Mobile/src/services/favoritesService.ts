import * as FileSystem from 'expo-file-system/legacy';

const PATH = `${FileSystem.documentDirectory}nexio_favorites.json`;

export async function loadFavorites(): Promise<Set<string>> {
  try {
    const info = await FileSystem.getInfoAsync(PATH);
    if (!info.exists) return new Set();
    const raw = await FileSystem.readAsStringAsync(PATH);
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function saveFavorites(favs: Set<string>): Promise<void> {
  await FileSystem.writeAsStringAsync(PATH, JSON.stringify([...favs]));
}
