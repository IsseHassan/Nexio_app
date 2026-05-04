import Constants from 'expo-constants';
import type { AdVariation } from '../constants';

export interface VariationScore {
  amazon: number;
  instagram: number;
  etsy: number;
  tiktok: number;
  best_for: string[];
  label: string;
}

export interface ScoringResult {
  scores: Record<string, VariationScore>;
  overall_best: string;
}

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

export async function scoreVariations(
  variations: AdVariation[],
  productType: string,
): Promise<ScoringResult> {
  const completed = variations.filter(v => v.status === 'completed');
  if (!completed.length) return { scores: {}, overall_best: '' };

  const list = completed.map(v => `${v.type}: "${v.label}"`).join('\n');

  const prompt = `You are an e-commerce conversion expert. Score these product image types.

Product: ${productType}
Image types:
${list}

Score each on Amazon, Instagram, Etsy, TikTok (0–100) and give a short label like "Best for Amazon".
Pick the single overall_best type.

General guidance:
- main_shot → high Amazon/Etsy
- lifestyle_scene → high Instagram
- human_interaction → high Instagram/TikTok
- macro_detail → high Etsy
- studio_stand → high Etsy/Amazon
- hand_held → high TikTok/Instagram

Return ONLY valid JSON, no markdown:
{"scores":{"<type>":{"amazon":85,"instagram":60,"etsy":90,"tiktok":45,"best_for":["amazon"],"label":"Best for Amazon"}},"overall_best":"<type>"}`;

  try {
    const res = await fetch(`${getApiUrl()}/api/generate-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return { scores: {}, overall_best: '' };
    const { text } = await res.json();
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned) as ScoringResult;
  } catch {
    return { scores: {}, overall_best: '' };
  }
}
