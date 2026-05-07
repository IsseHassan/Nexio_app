import { getAI } from '../config.js';
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
      for (const part of (resp.candidates?.[0]?.content?.parts ?? [])) {
        if (part.inlineData?.data)
          return `data:${part.inlineData.mimeType ?? 'image/jpeg'};base64,${part.inlineData.data}`;
      }
      throw new Error('No image data in response');
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const is429 = msg.includes('429') || err?.status === 429;
      const transient = is429 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded');
      console.error(`Image attempt ${attempt + 1}/${MAX_RETRIES}: ${msg.slice(0, 200)}`);
      if (transient && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, is429 ? 65_000 * (attempt + 1) : 10_000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}
