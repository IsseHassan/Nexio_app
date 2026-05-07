import { Router } from 'express';
import multer from 'multer';
import archiver from 'archiver';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { withConcurrency, batchStore } from '../state.js';
import { callTextModel, callImageModel } from '../services/aiService.js';
import type { BulkBatch, BulkItem } from '../types.js';

const BULK_MAX_PRODUCTS     = 100;
const BULK_PRODUCT_PARALLEL = 3;

const VALID_CATEGORIES = [
  'Furniture', 'Jewelry', 'Electronics', 'Apparel',
  'Beauty', 'Food', 'HomeDecor', 'Pet', 'Handmade',
  'Sports', 'Books', 'Baby', 'General',
];

const CATEGORY_ALIASES: Record<string, string> = {
  fashion: 'Apparel', apparel: 'Apparel', clothing: 'Apparel',
  homedecor: 'HomeDecor', home: 'HomeDecor', decor: 'HomeDecor',
};

function normalizeCategory(raw: string): string {
  const c = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return CATEGORY_ALIASES[c] ?? VALID_CATEGORIES.find(v => v.toLowerCase() === c) ?? 'General';
}

function getMimeType(filename: string): string {
  const m: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.heic': 'image/heic',
  };
  return m[path.extname(filename).toLowerCase()] ?? 'image/jpeg';
}

function normalizeFilename(name: string): string {
  return name.toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|avif)$/i, '')
    .replace(/[\s_-]+/g, '');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []; let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim()); return result;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function buildBulkPrompts(
  analysis: { product_type: string; color: string; material: string; style: string; media_type: string },
  category: string, customNotes: string, brandStyleNotes: string,
): string[] {
  const isSketch = analysis.media_type === 'sketch' || analysis.media_type === 'illustration';
  const desc = [analysis.color, analysis.material, analysis.product_type].filter(Boolean).join(' ') || 'product';
  const ref = isSketch
    ? `The reference is a sketch. Render a photorealistic ${desc}.`
    : `Use the reference image to understand this ${desc}. Generate a new professionally lit commercial image.`;
  const note = [customNotes, brandStyleNotes].filter(Boolean).join('. ');
  const extra = note ? ` ${note}.` : '';
  return [
    `${ref} Hero studio shot: white/light-grey seamless background, even lighting, sharp focus on all details.${extra}`,
    `${ref} Lifestyle shot: aspirational real-world setting for ${category}, warm natural light, product as hero.${extra}`,
    `${ref} Detail close-up: macro emphasising the most distinctive texture or craftsmanship, ultra-shallow DOF.${extra}`,
  ];
}

async function processItem(batch: BulkBatch, item: BulkItem): Promise<void> {
  item.status = 'processing';
  console.log(`[bulk:${batch.id}] processing ${item.sku}…`);
  try {
    const base64   = fs.readFileSync(item.imagePath!).toString('base64');
    const mimeType = item.imageMimeType ?? 'image/jpeg';

    const analyzeRaw = await callTextModel(
      `Analyze this product image. Return ONLY valid JSON, no markdown:
{"product_type":"","color":"","material":"","style":"","media_type":""}
media_type: photo, sketch, illustration, or render.`,
      base64, mimeType,
    );
    let analysis = { product_type: 'product', color: '', material: '', style: '', media_type: 'photo' };
    try { analysis = { ...analysis, ...JSON.parse(analyzeRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()) }; } catch {}

    const prompts = buildBulkPrompts(analysis, item.category, item.customNotes, batch.brandStyleNotes);
    item.generatedImageUrls = await Promise.all(
      prompts.map(prompt => withConcurrency(() => callImageModel(base64, mimeType, prompt))),
    );

    const listingRaw = await callTextModel(
      `Write a professional marketplace listing for this ${item.category} product.${item.customNotes ? ` Notes: ${item.customNotes}.` : ''}
Return ONLY valid JSON, no markdown:
{"title":"","description":"","keywords":[]}`,
      base64, mimeType,
    );
    let listing = { title: item.sku, description: '', keywords: [] as string[] };
    try { listing = { ...listing, ...JSON.parse(listingRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()) }; } catch {}
    item.listingResult = listing;
    item.status = 'completed';
    console.log(`[bulk:${batch.id}] ✓ ${item.sku}`);
  } catch (e: any) {
    item.status = 'failed';
    item.errorMessage = e?.message ?? 'Processing failed';
    item.retryCount++;
    console.error(`[bulk:${batch.id}] ✗ ${item.sku}:`, e?.message);
  }
}

async function processBatch(batchId: string): Promise<void> {
  const batch = batchStore.get(batchId);
  if (!batch) return;
  batch.status = 'processing';
  batch.startedAt = Date.now();
  const items = batch.items.filter(i => i.status === 'pending');
  console.log(`[bulk:${batchId}] starting — ${items.length} items, ${BULK_PRODUCT_PARALLEL} parallel`);
  for (let i = 0; i < items.length; i += BULK_PRODUCT_PARALLEL) {
    await Promise.all(items.slice(i, i + BULK_PRODUCT_PARALLEL).map(item => processItem(batch, item)));
  }
  const anyOk   = batch.items.some(i => i.status === 'completed');
  const anyFail = batch.items.some(i => i.status === 'failed');
  batch.status = anyOk && anyFail ? 'partial_failed' : anyFail ? 'failed' : 'completed';
  batch.completedAt = Date.now();
  console.log(`[bulk:${batchId}] done in ${Math.round((batch.completedAt - batch.startedAt!) / 1000)}s — ${batch.status}`);
}

const bulkUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename:    (_req, file, cb) => cb(null, `bulk-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: BULK_MAX_PRODUCTS + 1 },
});

const router = Router();

router.post('/bulk/upload',
  bulkUpload.fields([{ name: 'csv', maxCount: 1 }, { name: 'images', maxCount: BULK_MAX_PRODUCTS }]),
  (req, res) => {
    const files      = req.files as Record<string, Express.Multer.File[]> | undefined;
    const csvFile    = files?.csv?.[0];
    const imageFiles = files?.images ?? [];
    if (!csvFile) { res.status(400).json({ error: 'CSV file required' }); return; }

    const csvText = fs.readFileSync(csvFile.path, 'utf-8');
    fs.unlink(csvFile.path, () => {});
    const rows = parseCSV(csvText);
    if (rows.length === 0) { res.status(400).json({ error: 'CSV is empty or has no data rows' }); return; }

    const missing = ['image_filename', 'category', 'sku'].filter(c => !(c in rows[0]));
    if (missing.length) { res.status(400).json({ error: `CSV missing: ${missing.join(', ')}` }); return; }
    if (rows.length > BULK_MAX_PRODUCTS) { res.status(400).json({ error: `Max ${BULK_MAX_PRODUCTS} products per batch` }); return; }

    const imageMap = new Map<string, Express.Multer.File>();
    for (const f of imageFiles) imageMap.set(normalizeFilename(f.originalname), f);

    const seenSkus: Set<string> = new Set();
    const validationErrors: any[] = [];
    const items: BulkItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { sku, image_filename, category, custom_notes } = rows[i];
      if (!sku)           { validationErrors.push({ row: i + 1, sku, error: 'Missing SKU' }); continue; }
      if (!image_filename){ validationErrors.push({ row: i + 1, sku, error: 'Missing image_filename' }); continue; }
      if (seenSkus.has(sku)) { validationErrors.push({ row: i + 1, sku, error: 'Duplicate SKU' }); continue; }
      seenSkus.add(sku);
      const cat     = normalizeCategory(category ?? '');
      const matched = imageMap.get(normalizeFilename(image_filename));
      items.push({
        id: Math.random().toString(36).slice(2) + i, sku,
        imageFilename: image_filename,
        imagePath:     matched?.path,
        imageMimeType: matched ? (matched.mimetype || getMimeType(matched.originalname)) : undefined,
        category: cat, customNotes: custom_notes?.trim() ?? '',
        status: matched ? 'pending' : 'failed',
        errorMessage: matched ? undefined : `Image not found: ${image_filename}`,
        retryCount: 0, generatedImageUrls: [],
      });
    }

    const batchId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    batchStore.set(batchId, { id: batchId, status: 'ready', items, brandStyleNotes: '', createdAt: Date.now() });
    const ready = items.filter(i => i.status === 'pending').length;
    console.log(`[bulk] created ${batchId} — ${items.length} items, ${ready} ready`);
    res.json({
      batchId, validationErrors,
      summary: { total: items.length, ready, missingImages: items.filter(i => !i.imagePath).length },
      items: items.map(i => ({ id: i.id, sku: i.sku, imageFilename: i.imageFilename, category: i.category, status: i.status, errorMessage: i.errorMessage, imageMatched: !!i.imagePath })),
    });
  },
);

router.get('/bulk/:id', (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  const counts = { completed: 0, failed: 0, processing: 0, pending: 0 };
  for (const i of batch.items) counts[i.status]++;
  res.json({
    id: batch.id, status: batch.status, total: batch.items.length, ...counts,
    createdAt: batch.createdAt, startedAt: batch.startedAt, completedAt: batch.completedAt,
    items: batch.items.map(i => ({ id: i.id, sku: i.sku, category: i.category, status: i.status, errorMessage: i.errorMessage })),
  });
});

router.post('/bulk/:id/start', async (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  if (batch.status !== 'ready') { res.status(400).json({ error: `Batch is "${batch.status}", expected "ready"` }); return; }
  const { brandStyleNotes, items: edits } = req.body;
  if (brandStyleNotes !== undefined) batch.brandStyleNotes = brandStyleNotes;
  for (const edit of (edits ?? [])) {
    const item = batch.items.find(i => i.id === edit.id);
    if (!item) continue;
    if (edit.category && VALID_CATEGORIES.includes(edit.category)) item.category = edit.category;
    if (edit.customNotes !== undefined) item.customNotes = edit.customNotes;
  }
  res.json({ started: true, batchId: batch.id, itemCount: batch.items.filter(i => i.status === 'pending').length });
  processBatch(batch.id).catch(e => console.error('[bulk] processBatch crashed:', e));
});

router.post('/bulk/:id/retry-failed', (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  if (batch.status === 'processing') { res.status(400).json({ error: 'Batch is still processing' }); return; }
  let retried = 0;
  for (const item of batch.items) {
    if (item.status === 'failed' && item.imagePath) { item.status = 'pending'; item.errorMessage = undefined; retried++; }
  }
  if (retried === 0) { res.status(400).json({ error: 'No retryable failed items' }); return; }
  batch.status = 'ready';
  res.json({ retried });
  processBatch(batch.id).catch(e => console.error('[bulk] retry crashed:', e));
});

router.get('/bulk/:id/download', (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  if (batch.status === 'processing' || batch.status === 'ready') {
    res.status(400).json({ error: 'Batch not finished yet' }); return;
  }
  const dateStr = new Date(batch.createdAt).toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="nexio-batch-${dateStr}-${batch.id.slice(0, 6)}.zip"`);
  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.on('error', err => { console.error('[bulk] archiver error:', err); res.end(); });
  archive.pipe(res);
  const shotNames = ['hero', 'lifestyle', 'detail'];
  for (const item of batch.items.filter(i => i.status === 'completed')) {
    item.generatedImageUrls.forEach((url, idx) => {
      archive.append(Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), 'base64'), {
        name: `products/${item.sku}/images/${item.sku}-${shotNames[idx] ?? `shot-${idx + 1}`}.png`,
      });
    });
    if (item.listingResult) {
      archive.append(JSON.stringify(item.listingResult, null, 2), { name: `products/${item.sku}/copy/listing.json` });
      archive.append(
        `PRODUCT LISTING — ${item.sku}\n${'='.repeat(40)}\nTitle: ${item.listingResult.title}\n\nDescription:\n${item.listingResult.description}\n\nKeywords: ${item.listingResult.keywords.join(', ')}`,
        { name: `products/${item.sku}/copy/listing.txt` },
      );
    }
  }
  const csvRows = [
    'SKU,Category,Status,Title,Description,Keywords,Error',
    ...batch.items.map(i =>
      `"${i.sku}","${i.category}","${i.status}","${(i.listingResult?.title ?? '').replace(/"/g, '""')}","${(i.listingResult?.description ?? '').replace(/"/g, '""')}","${(i.listingResult?.keywords ?? []).join('|')}","${i.errorMessage ?? ''}"`
    ),
  ];
  archive.append(csvRows.join('\n'), { name: 'master/batch-report.csv' });
  const elapsed = batch.completedAt && batch.startedAt
    ? `${Math.round((batch.completedAt - batch.startedAt) / 60_000)} minutes` : 'N/A';
  archive.append(
    `Nexio Bulk Export\nGenerated: ${new Date(batch.completedAt ?? batch.createdAt).toUTCString()}\nProcessing time: ${elapsed}\nProducts: ${batch.items.filter(i => i.status === 'completed').length} / ${batch.items.length}`,
    { name: 'master/instructions.txt' },
  );
  archive.finalize();
});

export default router;
