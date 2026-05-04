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

export async function scoreVariations(
  variations: AdVariation[],
  productType: string,
): Promise<ScoringResult> {
  const completed = variations.filter(v => v.status === 'completed');
  if (!completed.length) return { scores: {}, overall_best: '' };

  const list = completed.map(v => `${v.type}: "${v.label}"`).join('\n');

  const prompt = `You are an e-commerce conversion expert. Score these product image types for platform effectiveness.

Product: ${productType}
Image types:
${list}

Score each type 0-100 on Amazon, Instagram, Etsy, TikTok. Pick best_for platforms and a short label.
Guidance: main_shot→Amazon/Etsy, lifestyle_scene→Instagram, human_interaction→Instagram/TikTok, macro_detail→Etsy, studio_stand→Etsy/Amazon, hand_held→TikTok/Instagram.

Return ONLY valid JSON, no markdown:
{"scores":{"<type>":{"amazon":85,"instagram":60,"etsy":90,"tiktok":45,"best_for":["amazon"],"label":"Best for Amazon"}},"overall_best":"<type>"}`;

  try {
    const res = await fetch('/api/generate-text', {
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
