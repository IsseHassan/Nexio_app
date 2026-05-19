import Constants from 'expo-constants';

export type Language = 'English' | 'Turkish' | 'Spanish' | 'German';
export type Tone = 'professional' | 'luxury' | 'casual' | 'fun';
export type ListingLength = 'short' | 'medium' | 'long';

export interface ListingResult {
  product_analysis: {
    category: string;
    product_type: string;
    material: string;
    color: string;
    style: string;
    use_case: string;
    target_audience: string;
  };
  global: {
    title: string;
    short_description: string;
    long_description: string;
    keywords: string[];
  };
  etsy: {
    title: string;
    tags: string[];
    description: {
      intro: string;
      details: string;
      materials: string;
      care: string;
      shipping: string;
      gift: string;
    };
  };
  amazon: {
    title: string;
    bullets: string[];
    description: string;
    backend_keywords: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
  tiktok: {
    hook: string;
    caption: string;
    hashtags: string[];
  };
}

export interface ListingParams {
  image: { base64: string; mimeType: string };
  category: string;
  language?: Language;
  tone?: Tone;
  length?: ListingLength;
  userDescription?: string;
}

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

const SYSTEM_PROMPT = `You are AdGenius AI — an advanced AI product listing generator designed for e-commerce sellers.

Your task is to analyze a product image and generate a COMPLETE, platform-optimized product listing.

You MUST:
1. Visually analyze the product (type, material, color, style, usage, category)
2. Infer key selling points (quality, aesthetic, use-case, target audience)
3. Generate structured outputs for multiple platforms (Etsy, Amazon, Instagram)
4. Adapt tone, structure, and SEO strategy per platform
5. Return output in STRICT JSON format (no extra text)

GLOBAL RULES:
- DO NOT hallucinate brand names
- DO NOT assume certifications unless visible
- If multiple objects exist → focus on main product
- If text exists on product → extract and use it
- Keep claims realistic (no fake guarantees)
- Optimize for conversion + SEO
- Output must be usable without editing

OUTPUT STRUCTURE — return ONLY this JSON shape:
{
  "product_analysis": { "category": "", "product_type": "", "material": "", "color": "", "style": "", "use_case": "", "target_audience": "" },
  "global": { "title": "", "short_description": "", "long_description": "", "keywords": [] },
  "etsy": { "title": "", "tags": [], "description": { "intro": "", "details": "", "materials": "", "care": "", "shipping": "", "gift": "" } },
  "amazon": { "title": "", "bullets": [], "description": "", "backend_keywords": [] },
  "instagram": { "caption": "", "hashtags": [] },
  "tiktok": { "hook": "", "caption": "", "hashtags": [] }
}

PLATFORM RULES:
ETSY — Title: long, keyword-rich, comma-separated phrases. Tags: max 13, SEO-focused, no duplicates. Description: emotional + structured sections.
AMAZON — Title: shorter, benefit-focused. Bullets: 5 items, ALL CAPS lead phrase + explanation. Description: clear, persuasive, conversion-focused. Backend keywords: hidden SEO, no repetition.
INSTAGRAM — Caption: emotional + lifestyle-oriented, short paragraphs. Hashtags: 10–20, mix of niche + broad.
TIKTOK — Hook: 1–2 scroll-stopping lines (< 15 words), start with "POV:", action verb, or bold claim. Caption: 3–5 short casual lines, emoji-heavy. Hashtags: 5–8, mix of #fyp/#trending + niche product tags.

TONE CONTROL: professional → clean/informative | luxury → elegant/premium | casual → friendly/simple | fun → playful/expressive
LENGTH CONTROL: short → minimal | medium → balanced | long → detailed/persuasive
LANGUAGE: generate output fully in selected language with natural fluency.

Return ONLY valid JSON. No markdown. No explanations.`;

export async function generateListing(params: ListingParams): Promise<ListingResult> {
  const prompt = [
    SYSTEM_PROMPT,
    '---',
    `category: ${params.category}`,
    `language: ${params.language ?? 'English'}`,
    `tone: ${params.tone ?? 'professional'}`,
    `length: ${params.length ?? 'medium'}`,
    ...(params.userDescription ? [`seller notes: ${params.userDescription}`] : []),
  ].join('\n');

  const url = `${getApiUrl()}/api/generate-text`;
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image: params.image }),
  };

  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetchWithTimeout(url, fetchOptions, 120_000);
      break;
    } catch (e: any) {
      const isTransient = e?.name === 'AbortError' || e?.message === 'Network request failed';
      if (isTransient && attempt === 0) {
        console.warn('[listingService] Transient error, retrying…');
        continue;
      }
      throw e;
    }
  }
  if (!res) throw new Error('Listing generation failed after retry');

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Listing generation failed');
  }
  const { text } = await res.json();
  if (!text) throw new Error('Empty response from listing AI');

  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    return JSON.parse(cleaned) as ListingResult;
  } catch {
    throw new Error(`Failed to parse listing JSON. Raw: ${text.slice(0, 300)}`);
  }
}
