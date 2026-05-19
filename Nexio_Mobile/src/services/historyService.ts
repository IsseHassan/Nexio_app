import { getServerUrl } from './settingsService';
import { getToken } from './tokenService';
import type { AdVariation } from '../constants';
import type { ListingResult } from './listingService';
import type { QuickAnalysis } from './analyzeService';
import type { GenerationGoal } from '../store/adStore';

const SKIP_NGROK = { 'ngrok-skip-browser-warning': '1' };

export interface KitEntry {
  id: string;
  createdAt: string;
  category: string;
  goal: GenerationGoal;
  name: string;
  thumbnailUrl: string;
  imageCount: number;
  hasListing: boolean;
  hasSocial: boolean;
}

export interface KitFullData extends KitEntry {
  variations: AdVariation[];
  listingResult: ListingResult | null;
  productAnalysis: QuickAnalysis | null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function saveKit(data: {
  category: string;
  goal: GenerationGoal;
  productImageUri?: string;
  variations: AdVariation[];
  listingResult: ListingResult | null;
  productAnalysis: QuickAnalysis | null;
}): Promise<string> {
  const completed = data.variations.filter(v => v.status === 'completed');
  const thumbnailUrl = completed[0]?.imageUrl?.startsWith('http')
    ? completed[0].imageUrl
    : '';

  const rawTitle = data.listingResult?.global?.title ?? '';
  const name = rawTitle
    ? rawTitle.split(/[\s,]+/).slice(0, 5).join(' ')
    : data.category;

  const cleanVariations = data.variations.map(v => ({
    id: v.id,
    label: v.label,
    imageUrl: v.imageUrl?.startsWith('http') ? v.imageUrl : '',
    status: v.status,
    type: v.type,
    prompt: v.prompt,
  }));

  const headers = await authHeaders();
  const res = await fetch(`${getServerUrl()}/api/kits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      category: data.category,
      goal: data.goal,
      name,
      thumbnailUrl,
      variations: cleanVariations,
      listingResult: data.listingResult,
      productAnalysis: data.productAnalysis,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to save kit');
  return json.kit.id;
}

export async function loadHistory(): Promise<KitEntry[]> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${getServerUrl()}/api/kits`, { headers });
    if (!res.ok) return [];
    const { kits } = await res.json();
    return kits.map((k: any) => ({
      id: k.id,
      createdAt: k.createdAt,
      category: k.category,
      goal: k.goal,
      name: k.name,
      thumbnailUrl: k.thumbnailUrl,
      imageCount: k.imageCount,
      hasListing: k.hasListing,
      hasSocial: k.hasSocial,
    }));
  } catch {
    return [];
  }
}

export async function loadKitFull(id: string): Promise<KitFullData | null> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${getServerUrl()}/api/kits/${id}`, { headers });
    if (!res.ok) return null;
    const { kit } = await res.json();
    return kit;
  } catch {
    return null;
  }
}

export async function deleteKit(id: string): Promise<void> {
  try {
    const headers = await authHeaders();
    await fetch(`${getServerUrl()}/api/kits/${id}`, { method: 'DELETE', headers });
  } catch {}
}
