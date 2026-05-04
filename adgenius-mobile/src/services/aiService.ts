import Constants from 'expo-constants';

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function generateAdImage(
  base64Image: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const url = `${getApiUrl()}/api/generate-image`;
  const body = JSON.stringify({ base64: base64Image, mimeType, prompt });
  const headers = { 'Content-Type': 'application/json' };

  // Two client-side attempts — covers transient "Network request failed" drops
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method: 'POST', headers, body }, 540_000); // 9 min
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Image generation failed (${res.status})`);
      }
      const { imageUrl } = await res.json();
      return imageUrl;
    } catch (e: any) {
      const isNetwork = e?.message === 'Network request failed' || e?.name === 'AbortError';
      if (isNetwork && attempt === 0) {
        console.warn('[aiService] Network drop on image, retrying…');
        continue;
      }
      throw e;
    }
  }
  throw new Error('Image generation failed after retry');
}
