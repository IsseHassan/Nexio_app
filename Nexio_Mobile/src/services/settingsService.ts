import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = `${FileSystem.documentDirectory}nexio-settings.json`;

function getDefaultUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (configured) return configured;
  // In Expo Go, debuggerHost is the Metro bundler host — same machine as the backend
  const metroHost = (Constants.expoGoConfig as any)?.debuggerHost?.split(':')[0];
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
    return `http://${metroHost}:8080`;
  }
  return 'http://localhost:8080';
}

const _defaultUrl = getDefaultUrl();
let _serverUrl = _defaultUrl;

function isPrivateIP(url: string): boolean {
  return /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url);
}

export async function loadSettings(): Promise<void> {
  try {
    const text = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    const data = JSON.parse(text);
    if (typeof data.serverUrl === 'string' && data.serverUrl.trim()) {
      const saved = data.serverUrl.trim().replace(/\/+$/, '');
      // Ignore a stale saved local IP when the app is now configured with a public URL (ngrok etc.)
      if (isPrivateIP(saved) && !isPrivateIP(_defaultUrl)) {
        await FileSystem.deleteAsync(SETTINGS_FILE, { idempotent: true });
        return;
      }
      _serverUrl = saved;
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
