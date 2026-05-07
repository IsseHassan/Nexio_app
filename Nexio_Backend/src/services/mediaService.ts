import { callMultimodalModel } from './aiService.js';

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  return (await callMultimodalModel(
    'Transcribe this audio recording accurately. Return only the transcription text with no labels or extra formatting.',
    [{ base64: audioBase64, mimeType }],
  )).trim();
}

export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<string> {
  return (await callMultimodalModel(
    'This is a product video. Describe the product comprehensively: what it is, key features, colors, materials, dimensions if visible, and any text shown. Output a single detailed paragraph for use in generating product listings.',
    [{ base64: videoBase64, mimeType }],
  )).trim();
}

export async function analyzeMultiAngle(
  images: Array<{ base64: string; mimeType: string }>,
  userText?: string,
): Promise<{ productDescription: string; features: string[]; suggestedPrompt: string }> {
  const contextNote = userText ? ` User notes: "${userText}".` : '';
  const raw = await callMultimodalModel(
    `Analyze these ${images.length} product photos from different angles.${contextNote} Return ONLY valid JSON, no markdown:
{"productDescription":"","features":[],"suggestedPrompt":""}
productDescription: 2-3 sentence comprehensive description
features: 5-8 key features/details observed across all angles
suggestedPrompt: detailed AI image generation prompt for professional product photos`,
    images.slice(0, 6),
  );
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); }
  catch { return { productDescription: raw.slice(0, 300), features: [], suggestedPrompt: '' }; }
}
