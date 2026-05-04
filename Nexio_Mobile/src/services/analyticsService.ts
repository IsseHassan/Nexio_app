import Constants from 'expo-constants';

function getApiUrl(): string {
  return (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8080';
}

export type EventType =
  | 'download_image'
  | 'favorite_variant'
  | 'copy_listing'
  | 'regenerate_variant'
  | 'select_style'
  | 'export_zip'
  | 'view_variant';

export interface AnalyticsEvent {
  category:    string;
  event_type:  EventType;
  variant_id?: string;
  style?:      string;
  platform?:   string;
  product_id?: string;
}

export interface StyleRecommendation {
  style:            string;
  conversion_score: number;
  confidence:       'High' | 'Medium' | 'Low';
  usage_count:      number;
  reason:           string;
}

export interface IntelligenceResult {
  top_recommendations: StyleRecommendation[];
  insights:            string[];
  best_variant:        { variant_id: string; style: string; reason: string } | null;
}

export function trackEvent(event: AnalyticsEvent): void {
  fetch(`${getApiUrl()}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, timestamp: new Date().toISOString() }),
  }).catch(() => {});
}

export async function getRecommendations(
  category: string,
  productType?: string,
): Promise<IntelligenceResult | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/intelligence/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, product_type: productType }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}
