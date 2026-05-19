import fs from 'fs';
import path from 'path';
import { getAI, API_KEY, MESHY_API_KEY, VIDEOS_DIR } from '../config.js';
import { withConcurrency } from '../state.js';

export async function callTextModel(
  prompt: string,
  imageBase64?: string,
  mimeType?: string,
): Promise<string> {
  const parts: any[] = [];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType ?? 'image/jpeg' } });
  parts.push({ text: prompt });
  const resp = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return resp.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function callMultimodalModel(
  prompt: string,
  mediaParts: Array<{ base64: string; mimeType: string }>,
): Promise<string> {
  const parts: any[] = mediaParts.map(p => ({ inlineData: { data: p.base64, mimeType: p.mimeType } }));
  parts.push({ text: prompt });
  const resp = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return resp.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function callImageModel(base64: string, mimeType: string, prompt: string): Promise<string> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resp = await getAI().models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{
          role: 'user',
          parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }],
        }],
        config: { responseModalities: ['IMAGE', 'TEXT'] },
      });
      const parts = resp.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data)
          return `data:${part.inlineData.mimeType ?? 'image/jpeg'};base64,${part.inlineData.data}`;
      }
      const textFallback = parts.find((p: any) => p.text)?.text ?? '';
      if (textFallback) console.warn(`[image] model returned text only: ${textFallback.slice(0, 120)}`);
      throw new Error('No image data in response');
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const is429    = msg.includes('429') || err?.status === 429;
      const noImage  = msg === 'No image data in response';
      const transient = is429 || noImage || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded');
      console.error(`Image attempt ${attempt + 1}/${MAX_RETRIES}: ${msg.slice(0, 200)}`);
      if (transient && attempt < MAX_RETRIES - 1) {
        const delay = is429 ? 65_000 * (attempt + 1) : noImage ? 4_000 * (attempt + 1) : 10_000 * (attempt + 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function callVideoModel(
  prompt: string,
  base64?: string,
  mimeType?: string,
): Promise<string> {
  const ai = getAI();

  const params: any = {
    model: 'veo-2.0-generate-001',
    prompt,
    config: { numberOfVideos: 1, aspectRatio: '9:16', durationSeconds: 5 },
  };
  if (base64 && mimeType) params.image = { imageBytes: base64, mimeType };

  let operation = await (ai.models as any).generateVideos(params);
  console.log('[video] operation started:', operation.name);

  let polls = 0;
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 5_000));
    operation = await (ai.operations as any).getVideosOperation({ operation });
    console.log(`[video] poll ${++polls}: done=${operation.done}`);
  }

  console.log('[video] raw response:', JSON.stringify(operation.response ?? operation, null, 2).slice(0, 800));

  if (operation.error) {
    throw new Error(`Veo error: ${operation.error.message ?? JSON.stringify(operation.error)}`);
  }

  const resp = operation.response ?? operation;
  const filtered = resp.raiMediaFilteredCount ?? 0;
  if (filtered > 0) {
    throw new Error(`Video blocked by content policy (${resp.raiMediaFilteredReasons?.join(', ') ?? 'safety filter'})`);
  }

  const videoUri: string | undefined =
    resp.generatedVideos?.[0]?.video?.uri ??
    resp.generatedSamples?.[0]?.video?.uri ??
    resp.videos?.[0]?.uri;

  if (!videoUri) throw new Error('No video URI in Veo response');

  const separator = videoUri.includes('?') ? '&' : '?';
  const download = await fetch(`${videoUri}${separator}key=${API_KEY}`);
  if (!download.ok) throw new Error(`Video download failed: ${download.status}`);
  const buf = Buffer.from(await download.arrayBuffer());

  const filename = `vid_${Date.now()}.mp4`;
  fs.writeFileSync(path.join(VIDEOS_DIR, filename), buf);
  return filename;
}

export interface Meshy3DResult {
  thumbnailUrl: string;
  videoUrl: string;
  modelUrls: { glb: string; obj?: string; usdz?: string };
}

export async function callMeshy3D(base64: string, mimeType: string): Promise<Meshy3DResult> {
  if (!MESHY_API_KEY) throw new Error('MESHY_API_KEY not set in .env');

  const imageData = `data:${mimeType};base64,${base64}`;
  const headers = { 'Authorization': `Bearer ${MESHY_API_KEY}`, 'Content-Type': 'application/json' };

  const createRes = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_data: imageData }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.message ?? `Meshy error ${createRes.status}`);
  }
  const { result: taskId } = await createRes.json();
  console.log('[3d] task:', taskId);

  for (let polls = 0; polls < 72; polls++) {
    await new Promise(r => setTimeout(r, 5_000));
    const pollRes = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, { headers });
    if (!pollRes.ok) throw new Error(`Poll failed: ${pollRes.status}`);
    const task = await pollRes.json();
    console.log(`[3d] poll ${polls + 1}: ${task.status} ${task.progress ?? ''}%`);

    if (task.status === 'SUCCEEDED') {
      return { thumbnailUrl: task.thumbnail_url, videoUrl: task.video_url, modelUrls: task.model_urls };
    }
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`3D generation ${task.status}: ${task.task_error?.message ?? 'unknown'}`);
    }
  }
  throw new Error('3D generation timed out');
}
