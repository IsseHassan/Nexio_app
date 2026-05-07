import fs from 'fs';
import type { BulkBatch, BulkItem } from './types.js';

// ── Image session cache ───────────────────────────────────────────────────────
export const imageCache = new Map<string, { base64: string; mimeType: string; ts: number }>();
setInterval(() => {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [k, v] of imageCache) if (v.ts < cutoff) imageCache.delete(k);
}, 5 * 60_000);

// ── Concurrency ───────────────────────────────────────────────────────────────
export let activeImages = 0;
const MAX_CONCURRENT = 2;
const _pending: Array<() => void> = [];

export async function withConcurrency<T>(task: () => Promise<T>): Promise<T> {
  if (activeImages >= MAX_CONCURRENT) await new Promise<void>(r => _pending.push(r));
  activeImages++;
  try { return await task(); }
  finally {
    activeImages--;
    if (_pending.length > 0) _pending.shift()!();
  }
}

// ── Bulk batch store ──────────────────────────────────────────────────────────
export const batchStore = new Map<string, BulkBatch>();
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60_000;
  for (const [id, batch] of batchStore) {
    if (batch.createdAt < cutoff) {
      for (const item of batch.items) {
        if (item.imagePath) fs.unlink(item.imagePath, () => {});
      }
      batchStore.delete(id);
    }
  }
}, 30 * 60_000);

// ── Chat rate limiting ────────────────────────────────────────────────────────
const _chatLimits = new Map<string, { count: number; resetAt: number }>();
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let e = _chatLimits.get(ip);
  if (!e || now > e.resetAt) e = { count: 0, resetAt: now + 60_000 };
  e.count++;
  _chatLimits.set(ip, e);
  return e.count > 10;
}
