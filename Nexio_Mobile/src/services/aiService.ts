import * as FileSystem from 'expo-file-system/legacy';
import { getServerUrl } from './settingsService';
import type { StylePreset } from '../stylePresets';
import type { QuickAnalysis } from './analyzeService';

function getApiUrl(): string {
  return getServerUrl();
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

// Upload the product image once — returns a sessionId reused for all variations
export async function cacheProductImage(base64: string, mimeType: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${getApiUrl()}/api/cache-image`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mimeType }),
    },
    60_000,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to cache image on server');
  }
  const { sessionId } = await res.json();
  return sessionId as string;
}

// Generate one ad image using a server-side cached session (no re-upload)
export async function generateAdImage(sessionId: string, prompt: string): Promise<string> {
  const url = `${getApiUrl()}/api/generate-image`;
  const body = JSON.stringify({ sessionId, prompt });
  const headers = { 'Content-Type': 'application/json' };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method: 'POST', headers, body }, 540_000);
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

// Generate 2 style-preset images using a cached session
export async function generateStyleImages(
  sessionId: string,
  preset: StylePreset,
  analysis: QuickAnalysis,
): Promise<[string, string]> {
  const isSketch = analysis.media_type === 'sketch' || analysis.media_type === 'illustration';
  const productDesc = [analysis.color, analysis.material, analysis.product_type].filter(Boolean).join(' ') || 'product';
  const refInstruction = isSketch
    ? `The reference is a design sketch/illustration. Interpret it and render a fully photorealistic ${productDesc} as if it were real.`
    : `Use the reference image to understand the exact design and details of the ${productDesc}. Generate a new professional commercial image — do not simply re-render the original photo.`;

  const prompt1 = `${refInstruction} ${preset.promptModifier}`;
  const prompt2 = `${refInstruction} Close-up detail version: ${preset.promptModifier} Emphasise the most beautiful or distinctive texture and craftsmanship detail.`;

  const [url1, url2] = await Promise.all([
    generateAdImage(sessionId, prompt1),
    generateAdImage(sessionId, prompt2),
  ]);
  return [url1, url2];
}

export async function transcribeVoice(audioBase64: string, mimeType = 'audio/m4a'): Promise<string> {
  const res = await fetchWithTimeout(
    `${getApiUrl()}/api/media/transcribe`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioBase64, mimeType }) },
    60_000,
  );
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Transcription failed');
  const { transcript } = await res.json();
  return transcript as string;
}

export async function analyzeVideoDescription(videoUri: string): Promise<string> {
  const uploadResult = await FileSystem.uploadAsync(
    `${getApiUrl()}/api/media/upload-video`,
    videoUri,
    { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: 'video' },
  );
  const data = JSON.parse(uploadResult.body);
  if (uploadResult.status >= 400) throw new Error(data.error ?? 'Video analysis failed');
  return data.description as string;
}

export async function analyzeProductAngles(
  images: Array<{ base64: string; mimeType: string }>,
  userText?: string,
): Promise<{ productDescription: string; features: string[]; suggestedPrompt: string }> {
  const res = await fetchWithTimeout(
    `${getApiUrl()}/api/media/analyze-angles`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images, userText }) },
    120_000,
  );
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Analysis failed');
  return res.json();
}
