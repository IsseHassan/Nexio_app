import fs from 'fs';
import path from 'path';
import { STORES_FILE, PUB_KITS_FILE, STORE_IMGS_DIR } from '../config.js';
import type { StoreSettings, PublishedKit } from '../types.js';

export function loadStores(): StoreSettings[] {
  try { return JSON.parse(fs.readFileSync(STORES_FILE, 'utf-8')); } catch { return []; }
}
export function saveStores(s: StoreSettings[]) {
  fs.writeFileSync(STORES_FILE, JSON.stringify(s, null, 2));
}
export function loadPubKits(): PublishedKit[] {
  try { return JSON.parse(fs.readFileSync(PUB_KITS_FILE, 'utf-8')); } catch { return []; }
}
export function savePubKits(k: PublishedKit[]) {
  fs.writeFileSync(PUB_KITS_FILE, JSON.stringify(k, null, 2));
}
export function saveStoreImage(dataUri: string, filename: string) {
  const b64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  fs.writeFileSync(path.join(STORE_IMGS_DIR, filename), Buffer.from(b64, 'base64'));
}
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
