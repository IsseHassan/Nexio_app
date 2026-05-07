import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = `${FileSystem.documentDirectory}nexio-settings.json`;

const _defaultUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';

let _serverUrl = _defaultUrl;

export async function loadSettings(): Promise<void> {
  try {
    const text = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    const data = JSON.parse(text);
    if (typeof data.serverUrl === 'string' && data.serverUrl.trim()) {
      _serverUrl = data.serverUrl.trim().replace(/\/+$/, '');
    }
  } catch {}
}

export function getServerUrl(): string {
  return _serverUrl;
}

export async function saveServerUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  _serverUrl = clean;
  await FileSystem.writeAsStringAsync(
    SETTINGS_FILE,
    JSON.stringify({ serverUrl: clean }),
  );
}

export function resetServerUrl(): Promise<void> {
  return saveServerUrl(_defaultUrl);
}
