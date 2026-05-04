import Constants from 'expo-constants';

export interface QuickAnalysis {
  product_type: string;
  color: string;
  material: string;
  style: string;
  media_type: 'photo' | 'sketch' | 'illustration' | 'render';
  target: string;
}

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

export async function analyzeProductQuick(
  imageBase64: string,
  mimeType: string,
): Promise<QuickAnalysis> {
  const prompt = 'Analyze this image and return ONLY valid JSON with exactly these 6 fields, no markdown:\n{"product_type":"","color":"","material":"","style":"","media_type":"","target":""}\n\nmedia_type must be one of: photo, sketch, illustration, render\ntarget is the intended buyer/wearer (e.g. "women", "men", "home interior", "tech enthusiast")\nBe specific. Example: {"product_type":"evening gown","color":"ivory white","material":"silk chiffon","style":"romantic high-fashion","media_type":"sketch","target":"women"}';

  const res = await fetch(`${getApiUrl()}/api/generate-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image: { base64: imageBase64, mimeType } }),
  });

  if (!res.ok) return { product_type: 'product', color: '', material: '', style: '', media_type: 'photo', target: '' };

  const { text } = await res.json();
  const cleaned = (text ?? '').replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    return JSON.parse(cleaned) as QuickAnalysis;
  } catch {
    return { product_type: 'product', color: '', material: '', style: '', media_type: 'photo', target: '' };
  }
}
