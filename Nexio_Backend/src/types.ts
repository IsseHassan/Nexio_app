export interface EventLog {
  user_id: string; product_id: string; category: string;
  event_type: string; variant_id: string; style: string;
  platform: string; timestamp: string;
}

export interface StyleStat {
  style: string; downloads: number; favorites: number; copies: number; score: number;
}

export interface BulkItem {
  id: string; sku: string; imageFilename: string;
  imagePath?: string; imageMimeType?: string;
  category: string; customNotes: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string; retryCount: number;
  generatedImageUrls: string[];
  listingResult?: { title: string; description: string; keywords: string[] };
}

export interface BulkBatch {
  id: string;
  status: 'ready' | 'processing' | 'completed' | 'partial_failed' | 'failed';
  items: BulkItem[];
  brandStyleNotes: string;
  createdAt: number; startedAt?: number; completedAt?: number;
}

export interface StoreSettings {
  id: string; userId: string; storeSlug: string;
  displayName: string; tagline: string;
  contactWhatsapp: string; contactEmail: string;
  isPublic: boolean; createdAt: string; updatedAt: string;
}

export interface PublishedKit {
  id: string; storeSlug: string; userId: string; isPublished: boolean;
  productName: string; category: string; goal: string;
  thumbnailPath: string; imagePaths: string[];
  listing: {
    title: string; shortDescription: string; longDescription: string;
    bullets: string[]; keywords: string[];
  };
  createdAt: string;
}
