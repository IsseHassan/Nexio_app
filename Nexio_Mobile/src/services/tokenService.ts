import * as FileSystem from 'expo-file-system/legacy';

const TOKEN_FILE = `${FileSystem.documentDirectory}nexio_token.txt`;

export async function getToken(): Promise<string | null> {
  try {
    const t = await FileSystem.readAsStringAsync(TOKEN_FILE);
    return t || null;
  } catch {
    return null;
  }
}
