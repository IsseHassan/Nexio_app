import Constants from 'expo-constants';

export interface QuickAnalysis {
  product_type: string;
  color: string;
  material: string;
  style: string;
  media_type: 'photo' | 'sketch' | 'illustration' | 'render';
  target: string;
  positioning: string;
  visual_direction: string;
}

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

export async function analyzeProductQuick(
  imageBase64: string,
  mimeType: string,
): Promise<QuickAnalysis> {
  const prompt = `Analyze this product image and return ONLY valid JSON with exactly these 8 fields, no markdown:
{"product_type":"","color":"","material":"","style":"","media_type":"","target":"","positioning":"","visual_direction":""}

media_type must be one of: photo, sketch, illustration, render
target: intended buyer/user (e.g. "women 25-35", "home interior enthusiasts", "tech professionals")
positioning: market positioning (e.g. "premium luxury", "budget friendly", "artisan handmade", "mass market")
visual_direction: visual mood guidance (e.g. "clean minimal white", "dark moody luxury", "warm natural outdoor", "bold colorful")
Be specific and concise. Example: {"product_type":"pendant necklace","color":"silver with pearl","material":"sterling silver","style":"minimalist luxury","media_type":"photo","target":"women 25-40","positioning":"premium luxury","visual_direction":"dark moody elegant"}`;

  const res = await fetch(`${getApiUrl()}/api/generate-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image: { base64: imageBase64, mimeType } }),
  });

  const fallback: QuickAnalysis = {
    product_type: 'product', color: '', material: '', style: '',
    media_type: 'photo', target: '', positioning: '', visual_direction: '',
  };

  if (!res.ok) return fallback;

  const { text } = await res.json();
  const cleaned = (text ?? '').replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    return { ...fallback, ...JSON.parse(cleaned) } as QuickAnalysis;
  } catch {
    return fallback;
  }
}
