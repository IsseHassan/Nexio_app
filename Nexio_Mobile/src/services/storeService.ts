import Constants from 'expo-constants';
import type { AdVariation } from '../constants';
import type { ListingResult } from './listingService';

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

export interface PublishParams {
  userId: string;
  storeSlug: string;
  displayName: string;
  tagline?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  kitId: string;
  productName: string;
  category: string;
  goal: string;
  variations: AdVariation[];
  listingResult: ListingResult | null;
}

export interface PublishResult {
  storeSlug: string;
  kitId: string;
  storeUrl: string;
  productUrl: string;
}

export interface StoreInfo {
  slug: string;
  displayName: string;
  tagline: string;
  contactWhatsapp: string;
  contactEmail: string;
  isPublic: boolean;
}

export interface MyStoreData {
  store: StoreInfo | null;
  kits: Array<{ id: string; productName: string; isPublished: boolean; thumbnailUrl: string | null }>;
  storeUrl: string;
}

export async function publishKit(params: PublishParams): Promise<PublishResult> {
  const completed = params.variations.filter(v => v.status === 'completed' && v.imageUrl);
  const thumbnailDataUri = completed[0]?.imageUrl ?? null;
  const imageDataUris = completed.slice(0, 6).map(v => v.imageUrl!);

  const body = {
    userId: params.userId,
    storeSlug: params.storeSlug,
    displayName: params.displayName,
    tagline: params.tagline ?? '',
    contactWhatsapp: params.contactWhatsapp ?? '',
    contactEmail: params.contactEmail ?? '',
    kitId: params.kitId,
    productName: params.productName,
    category: params.category,
    goal: params.goal,
    thumbnailDataUri,
    imageDataUris,
    listing: params.listingResult ? {
      title:            params.listingResult.global?.title            ?? '',
      shortDescription: params.listingResult.global?.short_description ?? '',
      longDescription:  params.listingResult.global?.long_description  ?? '',
      bullets:          params.listingResult.amazon?.bullets           ?? [],
      keywords:         params.listingResult.global?.keywords          ?? [],
    } : null,
  };

  const res = await fetch(`${getApiUrl()}/api/store/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Publish failed');
  }
  return res.json() as Promise<PublishResult>;
}

export async function getMyStore(userId: string): Promise<MyStoreData> {
  const res = await fetch(`${getApiUrl()}/api/store/manage/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to load store');
  return res.json() as Promise<MyStoreData>;
}

export async function toggleKitVisibility(slug: string, kitId: string, userId: string): Promise<boolean> {
  const res = await fetch(`${getApiUrl()}/api/store/${slug}/kit/${kitId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Toggle failed');
  const { isPublished } = await res.json();
  return isPublished as boolean;
}
