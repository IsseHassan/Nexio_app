import * as FileSystem from 'expo-file-system/legacy';
import type { AdVariation } from '../constants';
import type { ListingResult } from './listingService';
import type { QuickAnalysis } from './analyzeService';
import type { GenerationGoal } from '../store/adStore';

export interface KitEntry {
  id: string;
  createdAt: string;
  category: string;
  goal: GenerationGoal;
  name: string;
  thumbnailUri: string;
  imageCount: number;
  hasListing: boolean;
  hasSocial: boolean;
}

export interface KitFullData extends KitEntry {
  productImageUri: string;
  variations: AdVariation[];
  listingResult: ListingResult | null;
  productAnalysis: QuickAnalysis | null;
}

const KITS_DIR = `${FileSystem.documentDirectory}nexio_kits/`;
const INDEX_PATH = `${KITS_DIR}index.json`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(KITS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(KITS_DIR, { intermediates: true });
}

async function loadIndex(): Promise<KitEntry[]> {
  try {
    const info = await FileSystem.getInfoAsync(INDEX_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(INDEX_PATH);
    return JSON.parse(raw) as KitEntry[];
  } catch {
    return [];
  }
}

async function saveIndex(entries: KitEntry[]) {
  await ensureDir();
  await FileSystem.writeAsStringAsync(INDEX_PATH, JSON.stringify(entries));
}

async function saveDataUri(dataUri: string, path: string): Promise<string> {
  const base64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}

export async function saveKit(data: {
  category: string;
  goal: GenerationGoal;
  productImageUri: string;
  variations: AdVariation[];
  listingResult: ListingResult | null;
  productAnalysis: QuickAnalysis | null;
}): Promise<string> {
  await ensureDir();
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const kitDir = `${KITS_DIR}${id}/`;
  await FileSystem.makeDirectoryAsync(kitDir, { intermediates: true });

  // Persist each variation image as a local file so data URIs don't bloat the JSON index
  const savedVariations: AdVariation[] = [];
  for (const v of data.variations) {
    let imageUrl = v.imageUrl;
    if (imageUrl?.startsWith('data:')) {
      const filePath = `${kitDir}${v.id}.jpg`;
      try { imageUrl = await saveDataUri(imageUrl, filePath); } catch {}
    }
    savedVariations.push({ ...v, imageUrl });
  }

  const completed = savedVariations.filter(v => v.status === 'completed');
  const thumbnailUri = completed[0]?.imageUrl ?? data.productImageUri;

  const rawTitle = data.listingResult?.global?.title ?? '';
  const name = rawTitle
    ? rawTitle.split(/[\s,]+/).slice(0, 5).join(' ')
    : data.category;

  const entry: KitEntry = {
    id,
    createdAt: new Date().toISOString(),
    category: data.category,
    goal: data.goal,
    name,
    thumbnailUri,
    imageCount: completed.length,
    hasListing: !!data.listingResult,
    hasSocial: !!(data.listingResult?.instagram || data.listingResult?.tiktok),
  };

  const fullData: KitFullData = {
    ...entry,
    productImageUri: data.productImageUri,
    variations: savedVariations,
    listingResult: data.listingResult,
    productAnalysis: data.productAnalysis,
  };

  await FileSystem.writeAsStringAsync(`${kitDir}data.json`, JSON.stringify(fullData));

  const index = await loadIndex();
  await saveIndex([entry, ...index].slice(0, 50));

  return id;
}

export async function loadHistory(): Promise<KitEntry[]> {
  return loadIndex();
}

export async function loadKitFull(id: string): Promise<KitFullData | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(`${KITS_DIR}${id}/data.json`);
    return JSON.parse(raw) as KitFullData;
  } catch {
    return null;
  }
}

export async function deleteKit(id: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(`${KITS_DIR}${id}/`, { idempotent: true });
    const index = await loadIndex();
    await saveIndex(index.filter(e => e.id !== id));
  } catch {}
}
