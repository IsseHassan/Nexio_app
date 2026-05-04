import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import archiver from 'archiver';
import { GoogleGenAI } from '@google/genai';
import os from 'os';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Analytics: event log setup ────────────────────────────────────────────────
const DATA_DIR    = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.jsonl');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const API_KEY = process.env.GEMINI_API_KEY;
const PORT    = Number(process.env.PORT) || 8080;

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) ai = new GoogleGenAI({ apiKey: API_KEY! });
  return ai;
}

// ── Image session cache ────────────────────────────────────────────────────────
const imageCache = new Map<string, { base64: string; mimeType: string; ts: number }>();

setInterval(() => {
  const cutoff = Date.now() - 30 * 60_000;
  for (const [k, v] of imageCache) if (v.ts < cutoff) imageCache.delete(k);
}, 5 * 60_000);

// ── Concurrency: shared across single + bulk generation ────────────────────────
let activeImages = 0;
const MAX_CONCURRENT = 2;
const pending: Array<() => void> = [];

async function withConcurrency<T>(task: () => Promise<T>): Promise<T> {
  if (activeImages >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => pending.push(resolve));
  }
  activeImages++;
  try {
    return await task();
  } finally {
    activeImages--;
    if (pending.length > 0) pending.shift()!();
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Gemini text model (shared) ─────────────────────────────────────────────────
async function callTextModel(prompt: string, imageBase64?: string, mimeType?: string): Promise<string> {
  const parts: any[] = [];
  if (imageBase64) parts.push({ inlineData: { data: imageBase64, mimeType: mimeType ?? 'image/jpeg' } });
  parts.push({ text: prompt });

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Gemini image model ─────────────────────────────────────────────────────────
async function callImageModel(base64: string, mimeType: string, prompt: string): Promise<string> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getAI().models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: prompt },
          ],
        }],
        config: { responseModalities: ['IMAGE', 'TEXT'] },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) return `data:${part.inlineData.mimeType ?? 'image/jpeg'};base64,${part.inlineData.data}`;
      }
      throw new Error('No image data in response');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const is429 = msg.includes('429') || err?.status === 429;
      const isTransient = is429 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded');
      console.error(`Image attempt ${attempt + 1}/${MAX_RETRIES} failed: ${msg.slice(0, 200)}`);
      if (isTransient && attempt < MAX_RETRIES - 1) {
        const delay = is429 ? 65_000 * (attempt + 1) : 10_000 * (attempt + 1);
        console.log(`Retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// ── Routes: single-product ─────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'AI Studio', activeImages, cached: imageCache.size, batches: batchStore.size });
});

const STYLE_PRESETS = [
  { id: 'amazon_white',       name: 'Amazon White',     description: 'Pure white, marketplace-ready',  preview: '⬜', creditCost: 1 },
  { id: 'luxury_branding',    name: 'Luxury Branding',  description: 'Dark moody, premium feel',        preview: '🖤', creditCost: 1 },
  { id: 'tiktok_viral',       name: 'TikTok Viral',     description: 'Bold, punchy, scroll-stopping',   preview: '🎵', creditCost: 1 },
  { id: 'minimal_clean',      name: 'Minimal Clean',    description: 'White space, calm and elegant',   preview: '🤍', creditCost: 1 },
  { id: 'editorial_magazine', name: 'Editorial',        description: 'Artistic, magazine quality',      preview: '📸', creditCost: 1 },
  { id: 'scandinavian',       name: 'Scandinavian',     description: 'Light wood, soft and cozy',       preview: '🪵', creditCost: 1 },
  { id: 'flatlay_social',     name: 'Flatlay Social',   description: 'Top-down styled with props',      preview: '📷', creditCost: 1 },
  { id: 'outdoor_natural',    name: 'Outdoor Natural',  description: 'Real setting, golden hour light', preview: '🌿', creditCost: 1 },
  { id: 'closeup_texture',    name: 'Close-up Texture', description: 'Macro detail and material',       preview: '🔍', creditCost: 1 },
  { id: 'industrial_loft',    name: 'Industrial Loft',  description: 'Concrete, metal, urban modern',   preview: '🏗️', creditCost: 1 },
];

app.get('/api/style-presets', (_req, res) => res.json({ presets: STYLE_PRESETS }));

app.post('/api/cache-image', (req, res) => {
  const { base64, mimeType } = req.body as { base64: string; mimeType: string };
  if (!base64 || !mimeType) { res.status(400).json({ error: 'base64 and mimeType required' }); return; }
  const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  imageCache.set(sessionId, { base64, mimeType, ts: Date.now() });
  console.log(`[cache] ${sessionId} stored — ${Math.round(base64.length * 0.75 / 1024)}KB`);
  res.json({ sessionId });
});

app.post('/api/generate-image', (req, res) => {
  res.setTimeout(600_000);
  const { sessionId, base64, mimeType, prompt } = req.body as { sessionId?: string; base64?: string; mimeType?: string; prompt: string };

  let imgBase64: string;
  let imgMimeType: string;

  if (sessionId) {
    const cached = imageCache.get(sessionId);
    if (!cached) { res.status(400).json({ error: 'Image session expired or not found. Please restart generation.' }); return; }
    cached.ts = Date.now();
    imgBase64 = cached.base64;
    imgMimeType = cached.mimeType;
  } else if (base64 && mimeType) {
    imgBase64 = base64;
    imgMimeType = mimeType;
  } else {
    res.status(400).json({ error: 'Provide sessionId or base64+mimeType' });
    return;
  }

  const start = Date.now();
  withConcurrency(() => callImageModel(imgBase64, imgMimeType, prompt))
    .then(imageUrl => {
      console.log(`[image] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      res.json({ imageUrl });
    })
    .catch((err: any) => {
      console.error('generate-image error:', err?.message ?? err);
      res.status(500).json({ error: err?.message ?? String(err) });
    });
});

app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt, image } = req.body as { prompt: string; image?: { base64: string; mimeType: string } };
    const text = await callTextModel(prompt, image?.base64, image?.mimeType);
    res.json({ text });
  } catch (err: any) {
    console.error('generate-text error:', err?.message ?? err);
    res.status(500).json({ error: err?.message ?? 'Text generation failed' });
  }
});

// ── BLOCK 3.5: Analytics + Intelligence Engine ────────────────────────────────

interface EventLog {
  user_id:    string;
  product_id: string;
  category:   string;
  event_type: string;
  variant_id: string;
  style:      string;
  platform:   string;
  timestamp:  string;
}

interface StyleStat {
  style:     string;
  downloads: number;
  favorites: number;
  copies:    number;
  score:     number;
}

function appendEvent(event: EventLog): void {
  try { fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n'); }
  catch (e) { console.warn('[analytics] append failed:', e); }
}

function readEvents(): EventLog[] {
  try {
    const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
    return content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch { return []; }
}

function aggregateStyles(category?: string): StyleStat[] {
  const events = readEvents();
  const relevant = category
    ? events.filter(e => e.category.toLowerCase() === category.toLowerCase())
    : events;

  const map = new Map<string, { downloads: number; favorites: number; copies: number }>();
  for (const e of relevant) {
    if (!e.style) continue;
    if (!map.has(e.style)) map.set(e.style, { downloads: 0, favorites: 0, copies: 0 });
    const s = map.get(e.style)!;
    if (e.event_type === 'download_image' || e.event_type === 'export_zip') s.downloads++;
    if (e.event_type === 'favorite_variant') s.favorites++;
    if (e.event_type === 'copy_listing')     s.copies++;
  }

  const raw = Array.from(map.entries()).map(([style, c]) => ({
    style, ...c,
    score: (c.downloads * 0.5) + (c.favorites * 0.3) + (c.copies * 0.2),
  })).sort((a, b) => b.score - a.score);

  const maxScore = raw[0]?.score || 1;
  return raw.map(s => ({ ...s, score: parseFloat(((s.score / maxScore) * 5).toFixed(2)) }));
}

const INTELLIGENCE_PROMPT = `You are AdGenius Intelligence Engine. Analyze user interaction data and return actionable recommendations.

Scoring formula: score = (downloads * 0.5) + (favorites * 0.3) + (copies * 0.2), normalized 0–5.
Confidence: High = dominant usage + high score. Medium = moderate. Low = weak but relevant.
Insight style — Good: "Luxury Branding dominates jewelry (62%)". Bad: "Users like this".

Return ONLY valid JSON, no markdown:
{
  "top_recommendations": [{"style":"","conversion_score":0,"confidence":"","usage_count":0,"reason":""}],
  "insights": [""],
  "best_variant": {"variant_id":"","style":"","reason":""}
}

Rules: only use provided data. Keep reasons under 10 words. Tie everything to numbers.`;

async function runIntelligence(input: object): Promise<any> {
  const raw = await callTextModel(`${INTELLIGENCE_PROMPT}\n\nData:\n${JSON.stringify(input)}`);
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); }
  catch { return { top_recommendations: [], insights: [], best_variant: null }; }
}

// POST /api/events
app.post('/api/events', (req, res) => {
  appendEvent({
    user_id:    req.body.user_id    ?? 'anonymous',
    product_id: req.body.product_id ?? '',
    category:   req.body.category   ?? '',
    event_type: req.body.event_type ?? '',
    variant_id: req.body.variant_id ?? '',
    style:      req.body.style      ?? '',
    platform:   req.body.platform   ?? '',
    timestamp:  req.body.timestamp  ?? new Date().toISOString(),
  });
  res.json({ ok: true });
});

// GET /api/analytics/styles?category=jewelry
app.get('/api/analytics/styles', (req, res) => {
  const category = req.query.category as string | undefined;
  res.json({ category: category ?? 'all', styles: aggregateStyles(category) });
});

// POST /api/intelligence/recommend
app.post('/api/intelligence/recommend', async (req, res) => {
  const { category, product_type } = req.body as { category?: string; product_type?: string };
  const styles = aggregateStyles(category);

  if (styles.length < 2) {
    res.json({
      top_recommendations: [],
      insights: ['Not enough data yet — keep using AdGenius to unlock insights.'],
      best_variant: null,
    });
    return;
  }

  try {
    const result = await runIntelligence({
      category: category ?? 'General',
      styles,
      context: { user_category: category ?? '', product_type: product_type ?? '' },
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── BLOCK 4: Bulk Generation ───────────────────────────────────────────────────

const BULK_MAX_PRODUCTS = 100;
const BULK_IMAGES_PER_PRODUCT = 3; // hero, lifestyle, detail
const BULK_PRODUCT_PARALLEL = 3;   // products processed concurrently

const VALID_CATEGORIES = [
  'Furniture', 'Jewelry', 'Electronics', 'Apparel',
  'Beauty', 'Food', 'HomeDecor', 'Pet', 'Handmade',
  'Sports', 'Books', 'Baby', 'General',
];

interface BulkItem {
  id: string;
  sku: string;
  imageFilename: string;
  imagePath?: string;
  imageMimeType?: string;
  category: string;
  customNotes: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  retryCount: number;
  generatedImageUrls: string[];
  listingResult?: { title: string; description: string; keywords: string[] };
}

interface BulkBatch {
  id: string;
  status: 'ready' | 'processing' | 'completed' | 'partial_failed' | 'failed';
  items: BulkItem[];
  brandStyleNotes: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

const batchStore = new Map<string, BulkBatch>();

// Evict batches older than 2 hours (including their temp image files)
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

// ── Multer: disk storage for uploaded images ────────────────────────────────────
const bulkUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_');
      cb(null, `bulk-${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: BULK_MAX_PRODUCTS + 1 },
});

// ── CSV parsing ────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
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

// ── Filename matching ──────────────────────────────────────────────────────────
function normalizeFilename(name: string): string {
  return name.toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic|avif)$/i, '')
    .replace(/[\s_\-]+/g, '');
}

// ── Category normalisation (case-insensitive + common aliases) ─────────────────
const CATEGORY_ALIASES: Record<string, string> = {
  fashion:   'Apparel',
  apparel:   'Apparel',
  clothing:  'Apparel',
  homedecor: 'HomeDecor',
  home:      'HomeDecor',
  decor:     'HomeDecor',
};

function normalizeCategory(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  if (CATEGORY_ALIASES[cleaned]) return CATEGORY_ALIASES[cleaned];
  const match = VALID_CATEGORIES.find(c => c.toLowerCase() === cleaned);
  return match ?? 'General';
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.gif': 'image/gif',  '.heic': 'image/heic',
  };
  return map[ext] ?? 'image/jpeg';
}

// ── Bulk prompts (3 per product: hero, lifestyle, detail) ──────────────────────
function buildBulkPrompts(
  analysis: { product_type: string; color: string; material: string; style: string; media_type: string },
  category: string,
  customNotes: string,
  brandStyleNotes: string,
): string[] {
  const isSketch = analysis.media_type === 'sketch' || analysis.media_type === 'illustration';
  const desc = [analysis.color, analysis.material, analysis.product_type].filter(Boolean).join(' ') || 'product';
  const ref = isSketch
    ? `The reference is a design sketch/illustration. Interpret it and render a fully photorealistic ${desc} as if it were real.`
    : `Use the reference image to understand the exact design and details of this ${desc}. Generate a new, professionally lit commercial image — do NOT simply re-render the original photo.`;
  const extra = [customNotes, brandStyleNotes].filter(Boolean).join('. ');
  const extraNote = extra ? ` ${extra}.` : '';

  return [
    `${ref} Hero studio shot: pure white or light grey seamless background. Even studio lighting, sharp focus on every detail. Commercial product photography quality.${extraNote}`,
    `${ref} Lifestyle shot: product placed in an aspirational real-world setting appropriate for ${category}. Warm natural light, authentic context. The product is the clear hero.${extraNote}`,
    `${ref} Detail close-up: extreme macro photography emphasising the most distinctive material texture or craftsmanship feature. Ultra-shallow depth of field. Premium quality clearly visible.${extraNote}`,
  ];
}

// ── Per-item processing pipeline ──────────────────────────────────────────────
async function processItem(batch: BulkBatch, item: BulkItem): Promise<void> {
  item.status = 'processing';
  console.log(`[bulk:${batch.id}] processing ${item.sku}…`);

  try {
    const imgBuffer = fs.readFileSync(item.imagePath!);
    const base64 = imgBuffer.toString('base64');
    const mimeType = item.imageMimeType ?? 'image/jpeg';

    // Step 1: Analyze
    const analyzePrompt = `Analyze this product image. Return ONLY valid JSON with these 5 fields, no markdown:
{"product_type":"","color":"","material":"","style":"","media_type":""}
media_type: photo, sketch, illustration, or render. Be specific and concise.`;
    const analysisRaw = await callTextModel(analyzePrompt, base64, mimeType);
    const analysisCleaned = analysisRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    let analysis = { product_type: 'product', color: '', material: '', style: '', media_type: 'photo' };
    try { analysis = { ...analysis, ...JSON.parse(analysisCleaned) }; } catch {}

    // Step 2: Build prompts + generate images in parallel (semaphore-controlled)
    const prompts = buildBulkPrompts(analysis, item.category, item.customNotes, batch.brandStyleNotes);
    const imageUrls = await Promise.all(
      prompts.map(prompt => withConcurrency(() => callImageModel(base64, mimeType, prompt))),
    );

    // Step 3: Generate listing
    const listingPrompt = `Write a professional marketplace listing for this ${item.category} product.${item.customNotes ? ` Notes: ${item.customNotes}.` : ''}
Return ONLY valid JSON with these 3 fields, no markdown:
{"title":"","description":"","keywords":[]}
title: compelling product title (max 100 chars)
description: 2-3 sentence product description, highlight key benefits
keywords: array of 8-10 SEO keywords`;
    const listingRaw = await callTextModel(listingPrompt, base64, mimeType);
    const listingCleaned = listingRaw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    let listing = { title: item.sku, description: '', keywords: [] as string[] };
    try { listing = { ...listing, ...JSON.parse(listingCleaned) }; } catch {}

    item.generatedImageUrls = imageUrls;
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

// ── Batch processing orchestrator ──────────────────────────────────────────────
async function processBatch(batchId: string): Promise<void> {
  const batch = batchStore.get(batchId);
  if (!batch) return;

  batch.status = 'processing';
  batch.startedAt = Date.now();

  const items = batch.items.filter(i => i.status === 'pending');
  console.log(`[bulk:${batchId}] starting — ${items.length} items, ${BULK_PRODUCT_PARALLEL} parallel`);

  for (let i = 0; i < items.length; i += BULK_PRODUCT_PARALLEL) {
    const chunk = items.slice(i, i + BULK_PRODUCT_PARALLEL);
    await Promise.all(chunk.map(item => processItem(batch, item)));
  }

  const anyCompleted = batch.items.some(i => i.status === 'completed');
  const anyFailed    = batch.items.some(i => i.status === 'failed');
  batch.status = (anyCompleted && anyFailed) ? 'partial_failed' : anyFailed ? 'failed' : 'completed';
  batch.completedAt = Date.now();

  const elapsed = ((batch.completedAt - batch.startedAt!) / 1000).toFixed(0);
  console.log(`[bulk:${batchId}] done in ${elapsed}s — status: ${batch.status}`);
}

// ── Bulk routes ────────────────────────────────────────────────────────────────

// POST /api/bulk/upload — CSV + images in one multipart request
app.post('/api/bulk/upload',
  bulkUpload.fields([{ name: 'csv', maxCount: 1 }, { name: 'images', maxCount: BULK_MAX_PRODUCTS }]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const csvFile   = files?.csv?.[0];
    const imageFiles = files?.images ?? [];

    if (!csvFile) { res.status(400).json({ error: 'CSV file required' }); return; }

    const csvText = fs.readFileSync(csvFile.path, 'utf-8');
    fs.unlink(csvFile.path, () => {});
    const rows = parseCSV(csvText);

    if (rows.length === 0) { res.status(400).json({ error: 'CSV is empty or has no data rows' }); return; }

    const requiredCols = ['image_filename', 'category', 'sku'];
    const firstRow = rows[0];
    const missing = requiredCols.filter(c => !(c in firstRow));
    if (missing.length > 0) {
      res.status(400).json({ error: `CSV missing required columns: ${missing.join(', ')}` }); return;
    }

    if (rows.length > BULK_MAX_PRODUCTS) {
      res.status(400).json({ error: `Maximum ${BULK_MAX_PRODUCTS} products per batch` }); return;
    }

    // Build filename → file map
    const imageMap = new Map<string, Express.Multer.File>();
    for (const f of imageFiles) imageMap.set(normalizeFilename(f.originalname), f);

    // Build items
    const seenSkus = new Set<string>();
    const validationErrors: Array<{ row: number; sku: string; error: string }> = [];
    const items: BulkItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku           = row.sku?.trim() ?? '';
      const imageFilename = row.image_filename?.trim() ?? '';
      const category      = row.category?.trim() ?? '';
      const customNotes   = row.custom_notes?.trim() ?? '';

      if (!sku)           { validationErrors.push({ row: i + 1, sku, error: 'Missing SKU' }); continue; }
      if (!imageFilename) { validationErrors.push({ row: i + 1, sku, error: 'Missing image_filename' }); continue; }
      if (seenSkus.has(sku)) { validationErrors.push({ row: i + 1, sku, error: 'Duplicate SKU' }); continue; }
      seenSkus.add(sku);

      const effectiveCategory = normalizeCategory(category);
      if (effectiveCategory === 'General' && category.trim() !== '' && category.toLowerCase() !== 'general') {
        validationErrors.push({ row: i + 1, sku, error: `Unknown category "${category}" — defaulted to General` });
      }

      const matchedFile = imageMap.get(normalizeFilename(imageFilename));
      items.push({
        id: Math.random().toString(36).slice(2) + i,
        sku,
        imageFilename,
        imagePath:     matchedFile?.path,
        imageMimeType: matchedFile ? (matchedFile.mimetype || getMimeType(matchedFile.originalname)) : undefined,
        category: effectiveCategory,
        customNotes,
        status: matchedFile ? 'pending' : 'failed',
        errorMessage: matchedFile ? undefined : `Image not found: ${imageFilename}`,
        retryCount: 0,
        generatedImageUrls: [],
      });
    }

    const batchId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    batchStore.set(batchId, {
      id: batchId,
      status: 'ready',
      items,
      brandStyleNotes: '',
      createdAt: Date.now(),
    });

    const ready   = items.filter(i => i.status === 'pending').length;
    const noImage = items.filter(i => !i.imagePath).length;

    console.log(`[bulk] created batch ${batchId} — ${items.length} items, ${ready} ready, ${noImage} missing images`);

    res.json({
      batchId,
      summary: { total: items.length, ready, missingImages: noImage },
      validationErrors,
      items: items.map(i => ({
        id: i.id, sku: i.sku, imageFilename: i.imageFilename,
        category: i.category, customNotes: i.customNotes,
        status: i.status, errorMessage: i.errorMessage, imageMatched: !!i.imagePath,
      })),
    });
  },
);

// GET /api/bulk/:id — batch status (polled every 3s by frontend)
app.get('/api/bulk/:id', (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }

  const completed  = batch.items.filter(i => i.status === 'completed').length;
  const failed     = batch.items.filter(i => i.status === 'failed').length;
  const processing = batch.items.filter(i => i.status === 'processing').length;
  const pending    = batch.items.filter(i => i.status === 'pending').length;

  res.json({
    id: batch.id, status: batch.status,
    total: batch.items.length, completed, failed, processing, pending,
    createdAt: batch.createdAt, startedAt: batch.startedAt, completedAt: batch.completedAt,
    items: batch.items.map(i => ({
      id: i.id, sku: i.sku, category: i.category,
      status: i.status, errorMessage: i.errorMessage,
    })),
  });
});

// POST /api/bulk/:id/start — start processing (send final item edits here)
app.post('/api/bulk/:id/start', async (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  if (batch.status !== 'ready') { res.status(400).json({ error: `Batch status is "${batch.status}", expected "ready"` }); return; }

  const { brandStyleNotes, items: edits } = req.body as {
    brandStyleNotes?: string;
    items?: Array<{ id: string; category?: string; customNotes?: string }>;
  };

  if (brandStyleNotes !== undefined) batch.brandStyleNotes = brandStyleNotes;

  for (const edit of (edits ?? [])) {
    const item = batch.items.find(i => i.id === edit.id);
    if (!item) continue;
    if (edit.category && VALID_CATEGORIES.includes(edit.category)) item.category = edit.category;
    if (edit.customNotes !== undefined) item.customNotes = edit.customNotes;
  }

  // Credit gate placeholder:
  // if (userCredits(req) < batch.items.length * CREDIT_COST) { res.status(402)... }

  res.json({ started: true, batchId: batch.id, itemCount: batch.items.filter(i => i.status === 'pending').length });

  // Fire background processing — intentionally not awaited
  processBatch(batch.id).catch(e => console.error('[bulk] processBatch crashed:', e));
});

// POST /api/bulk/:id/retry-failed — re-queue failed items that have images
app.post('/api/bulk/:id/retry-failed', (req, res) => {
  const batch = batchStore.get(req.params.id);
  if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }
  if (batch.status === 'processing') { res.status(400).json({ error: 'Batch is still processing' }); return; }

  let retried = 0;
  for (const item of batch.items) {
    if (item.status === 'failed' && item.imagePath) {
      item.status = 'pending';
      item.errorMessage = undefined;
      retried++;
    }
  }
  if (retried === 0) { res.status(400).json({ error: 'No retryable failed items' }); return; }

  batch.status = 'ready';
  res.json({ retried });

  // Reset to processing and re-run
  batch.status = 'ready';
  processBatch(batch.id).catch(e => console.error('[bulk] retry crashed:', e));
});

// GET /api/bulk/:id/download — stream master ZIP
app.get('/api/bulk/:id/download', (req, res) => {
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
  const completedItems = batch.items.filter(i => i.status === 'completed');

  for (const item of completedItems) {
    item.generatedImageUrls.forEach((url, idx) => {
      const b64 = url.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      archive.append(buf, { name: `products/${item.sku}/images/${item.sku}-${shotNames[idx] ?? `shot-${idx + 1}`}.png` });
    });

    if (item.listingResult) {
      archive.append(JSON.stringify(item.listingResult, null, 2), {
        name: `products/${item.sku}/copy/listing.json`,
      });
      const txt = [
        `PRODUCT LISTING — ${item.sku}`,
        '='.repeat(40),
        `Title: ${item.listingResult.title}`,
        '',
        `Description:\n${item.listingResult.description}`,
        '',
        `Keywords: ${item.listingResult.keywords.join(', ')}`,
      ].join('\n');
      archive.append(txt, { name: `products/${item.sku}/copy/listing.txt` });
    }
  }

  // Master batch report CSV
  const csvRows = [
    'SKU,Category,Status,Title,Description,Keywords,Error',
    ...batch.items.map(item => {
      const t = item.listingResult?.title ?? '';
      const d = item.listingResult?.description ?? '';
      const k = item.listingResult?.keywords?.join('|') ?? '';
      const e = item.errorMessage ?? '';
      return `"${item.sku}","${item.category}","${item.status}","${t.replace(/"/g, '""')}","${d.replace(/"/g, '""')}","${k}","${e}"`;
    }),
  ];
  archive.append(csvRows.join('\n'), { name: 'master/batch-report.csv' });

  // Instructions file
  const elapsed = batch.completedAt && batch.startedAt
    ? `${Math.round((batch.completedAt - batch.startedAt) / 60_000)} minutes`
    : 'N/A';
  archive.append(
    [
      'Nexio Bulk Export',
      `Generated: ${new Date(batch.completedAt ?? batch.createdAt).toUTCString()}`,
      `Processing time: ${elapsed}`,
      `Products completed: ${completedItems.length} / ${batch.items.length}`,
      '',
      'FOLDER STRUCTURE',
      '  products/{sku}/images/  — 3 generated images (hero, lifestyle, detail)',
      '  products/{sku}/copy/    — listing.json + listing.txt',
      '  master/batch-report.csv — full batch summary with all listing copy',
    ].join('\n'),
    { name: 'master/instructions.txt' },
  );

  archive.finalize();
});

// ── BLOCK 7: Store + AI Sales Assistant ───────────────────────────────────────

const STORES_FILE      = path.join(DATA_DIR, 'stores.json');
const PUB_KITS_FILE    = path.join(DATA_DIR, 'published_kits.json');
const STORE_IMGS_DIR   = path.join(DATA_DIR, 'store-images');
const CHAT_LOG_FILE    = path.join(DATA_DIR, 'chatlogs.jsonl');
if (!fs.existsSync(STORE_IMGS_DIR)) fs.mkdirSync(STORE_IMGS_DIR, { recursive: true });

// Serve store images as static files
app.use('/store-images', express.static(STORE_IMGS_DIR));

interface StoreSettings {
  id: string; userId: string; storeSlug: string;
  displayName: string; tagline: string;
  contactWhatsapp: string; contactEmail: string;
  isPublic: boolean; createdAt: string; updatedAt: string;
}
interface PublishedKit {
  id: string; storeSlug: string; userId: string; isPublished: boolean;
  productName: string; category: string; goal: string;
  thumbnailPath: string; imagePaths: string[];
  listing: { title: string; shortDescription: string; longDescription: string; bullets: string[]; keywords: string[] };
  createdAt: string;
}

function loadStores(): StoreSettings[] {
  try { return JSON.parse(fs.readFileSync(STORES_FILE, 'utf-8')); } catch { return []; }
}
function saveStores(s: StoreSettings[]) { fs.writeFileSync(STORES_FILE, JSON.stringify(s, null, 2)); }
function loadPubKits(): PublishedKit[] {
  try { return JSON.parse(fs.readFileSync(PUB_KITS_FILE, 'utf-8')); } catch { return []; }
}
function savePubKits(k: PublishedKit[]) { fs.writeFileSync(PUB_KITS_FILE, JSON.stringify(k, null, 2)); }

function saveStoreImage(dataUri: string, filename: string) {
  const b64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  fs.writeFileSync(path.join(STORE_IMGS_DIR, filename), Buffer.from(b64, 'base64'));
}

// Rate limit: 10 chat messages per IP per minute
const chatRateLimits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let e = chatRateLimits.get(ip);
  if (!e || now > e.resetAt) e = { count: 0, resetAt: now + 60_000 };
  e.count++;
  chatRateLimits.set(ip, e);
  return e.count > 10;
}

function appendChatLog(log: object) {
  try { fs.appendFileSync(CHAT_LOG_FILE, JSON.stringify({ ...log, createdAt: new Date().toISOString() }) + '\n'); } catch {}
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function base(req: express.Request) { return `${req.protocol}://${req.get('host')}`; }

// POST /api/store/publish — create/update store + publish kit
app.post('/api/store/publish', async (req, res) => {
  const { userId, storeSlug, displayName, tagline, contactWhatsapp, contactEmail,
          kitId, productName, category, goal, thumbnailDataUri, imageDataUris, listing } = req.body;
  if (!userId || !storeSlug || !kitId) { res.status(400).json({ error: 'userId, storeSlug, kitId required' }); return; }

  const slug = slugify(storeSlug);
  if (!slug) { res.status(400).json({ error: 'Invalid store slug' }); return; }

  const stores = loadStores();
  const existing = stores.find(s => s.storeSlug === slug);
  if (existing && existing.userId !== userId) { res.status(409).json({ error: 'Store slug already taken. Choose another.' }); return; }

  if (!existing) {
    stores.push({ id: Math.random().toString(36).slice(2) + Date.now().toString(36), userId, storeSlug: slug,
      displayName: displayName || slug, tagline: tagline || '', contactWhatsapp: contactWhatsapp || '',
      contactEmail: contactEmail || '', isPublic: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } else {
    const i = stores.indexOf(existing);
    stores[i] = { ...existing,
      displayName: displayName ?? existing.displayName, tagline: tagline ?? existing.tagline,
      contactWhatsapp: contactWhatsapp ?? existing.contactWhatsapp, contactEmail: contactEmail ?? existing.contactEmail,
      updatedAt: new Date().toISOString() };
  }
  saveStores(stores);

  // Persist images
  let thumbnailPath = '';
  const imagePaths: string[] = [];
  if (thumbnailDataUri?.startsWith('data:')) {
    thumbnailPath = `${kitId}-thumb.jpg`;
    try { saveStoreImage(thumbnailDataUri, thumbnailPath); } catch {}
  }
  for (let i = 0; i < (imageDataUris ?? []).length; i++) {
    const uri = imageDataUris[i];
    if (uri?.startsWith('data:')) {
      const fn = `${kitId}-${i}.jpg`;
      try { saveStoreImage(uri, fn); imagePaths.push(fn); } catch {}
    }
  }

  const kits = loadPubKits();
  const existingKit = kits.find(k => k.id === kitId);
  const kitData: PublishedKit = {
    id: kitId, storeSlug: slug, userId, isPublished: true,
    productName: productName || listing?.title || listing?.global?.title || category || 'Product',
    category: category || 'General', goal: goal || 'full',
    thumbnailPath, imagePaths,
    listing: {
      title:            listing?.title            || listing?.global?.title            || '',
      shortDescription: listing?.shortDescription || listing?.global?.short_description || '',
      longDescription:  listing?.longDescription  || listing?.global?.long_description  || '',
      bullets:          listing?.bullets          || listing?.amazon?.bullets           || [],
      keywords:         listing?.keywords         || listing?.global?.keywords          || [],
    },
    createdAt: existingKit?.createdAt || new Date().toISOString(),
  };
  if (existingKit) kits[kits.indexOf(existingKit)] = kitData;
  else kits.push(kitData);
  savePubKits(kits);

  const B = base(req);
  res.json({ ok: true, storeSlug: slug, kitId,
    storeUrl: `${B}/store/${slug}`, productUrl: `${B}/store/${slug}/${kitId}` });
});

// GET /api/store/manage/:userId — user's own store (mobile dashboard)
app.get('/api/store/manage/:userId', (req, res) => {
  const store = loadStores().find(s => s.userId === req.params.userId);
  if (!store) { res.json({ store: null, kits: [] }); return; }
  const kits = loadPubKits().filter(k => k.storeSlug === store.storeSlug && k.userId === req.params.userId);
  const B = base(req);
  res.json({
    store: { slug: store.storeSlug, displayName: store.displayName, tagline: store.tagline,
             contactWhatsapp: store.contactWhatsapp, contactEmail: store.contactEmail, isPublic: store.isPublic },
    kits: kits.map(k => ({ id: k.id, productName: k.productName, isPublished: k.isPublished,
      thumbnailUrl: k.thumbnailPath ? `${B}/store-images/${k.thumbnailPath}` : null })),
    storeUrl: `${B}/store/${store.storeSlug}`,
  });
});

// GET /api/store/:slug — public store home
app.get('/api/store/:slug', (req, res) => {
  const store = loadStores().find(s => s.storeSlug === req.params.slug && s.isPublic);
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }
  const kits = loadPubKits().filter(k => k.storeSlug === req.params.slug && k.isPublished);
  const B = base(req);
  res.json({
    store: { slug: store.storeSlug, displayName: store.displayName, tagline: store.tagline,
             contactWhatsapp: store.contactWhatsapp, contactEmail: store.contactEmail },
    kits: kits.map(k => ({ id: k.id, productName: k.productName, category: k.category,
      thumbnailUrl: k.thumbnailPath ? `${B}/store-images/${k.thumbnailPath}` : null,
      shortDescription: k.listing.shortDescription })),
  });
});

// GET /api/store/:slug/kit/:kitId — public product detail
app.get('/api/store/:slug/kit/:kitId', (req, res) => {
  const { slug, kitId } = req.params;
  const kit = loadPubKits().find(k => k.storeSlug === slug && k.id === kitId && k.isPublished);
  if (!kit) { res.status(404).json({ error: 'Product not found' }); return; }
  const store = loadStores().find(s => s.storeSlug === slug);
  const B = base(req);
  res.json({
    kit: { id: kit.id, productName: kit.productName, category: kit.category,
      thumbnailUrl: kit.thumbnailPath ? `${B}/store-images/${kit.thumbnailPath}` : null,
      imageUrls: kit.imagePaths.map(p => `${B}/store-images/${p}`), listing: kit.listing },
    store: store ? { slug: store.storeSlug, displayName: store.displayName,
      contactWhatsapp: store.contactWhatsapp, contactEmail: store.contactEmail } : null,
  });
});

// PATCH /api/store/:slug/kit/:kitId/toggle — publish/unpublish
app.patch('/api/store/:slug/kit/:kitId/toggle', (req, res) => {
  const { slug, kitId } = req.params;
  const kits = loadPubKits();
  const kit = kits.find(k => k.storeSlug === slug && k.id === kitId && k.userId === req.body.userId);
  if (!kit) { res.status(404).json({ error: 'Kit not found' }); return; }
  kit.isPublished = !kit.isPublished;
  savePubKits(kits);
  res.json({ ok: true, isPublished: kit.isPublished });
});

// POST /api/store/chat — AI Sales Assistant
const SALES_SYSTEM = `You are an AI sales assistant for an online store.
Rules: Answer ONLY based on the provided product data. If unsure, say "I'm not sure — please contact the seller."
Keep answers short and friendly. Never invent specs or process payments.
Always end: "To purchase, tap the Contact button to message the seller directly."`;

app.post('/api/store/chat', async (req, res) => {
  const ip = String(req.ip ?? req.socket.remoteAddress ?? '').replace(/^.*:/, '');
  if (isRateLimited(ip)) { res.status(429).json({ error: 'Too many messages. Please wait a moment.' }); return; }

  const { storeSlug, kitId, userMessage } = req.body as { storeSlug: string; kitId?: string; userMessage: string };
  if (!storeSlug || !userMessage?.trim()) { res.status(400).json({ error: 'storeSlug and userMessage required' }); return; }

  const kits = loadPubKits();
  let context = '';
  if (kitId) {
    const kit = kits.find(k => k.id === kitId && k.storeSlug === storeSlug && k.isPublished);
    if (kit) context = [
      `Product: ${kit.productName}`, `Category: ${kit.category}`,
      kit.listing.title && `Title: ${kit.listing.title}`,
      kit.listing.shortDescription && `Description: ${kit.listing.shortDescription}`,
      kit.listing.longDescription && `Details: ${kit.listing.longDescription.slice(0, 600)}`,
      kit.listing.bullets.length && `Features:\n${kit.listing.bullets.slice(0, 5).map(b => `- ${b}`).join('\n')}`,
      kit.listing.keywords.length && `Keywords: ${kit.listing.keywords.slice(0, 8).join(', ')}`,
    ].filter(Boolean).join('\n');
  } else {
    const storeKits = kits.filter(k => k.storeSlug === storeSlug && k.isPublished).slice(0, 8);
    context = `Store products:\n${storeKits.map(k => `- ${k.productName}: ${k.listing.shortDescription}`).join('\n')}`;
  }

  const prompt = `${SALES_SYSTEM}\n\nProduct data:\n${context || 'No product data.'}\n\nCustomer: ${userMessage.trim().slice(0, 500)}`;
  try {
    const text = await callTextModel(prompt);
    const response = text.trim() || "I'm not sure — please contact the seller.";
    appendChatLog({ storeSlug, kitId, userMessage: userMessage.trim(), aiResponse: response });
    res.json({ response });
  } catch {
    res.status(500).json({ error: 'Assistant temporarily unavailable.' });
  }
});

// ── Server ─────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`\nNexio API server → http://localhost:${PORT}`);
  console.log(`Mode: Google AI Studio | Concurrency: ${MAX_CONCURRENT} images at a time`);
  console.log(`Bulk: ${BULK_IMAGES_PER_PRODUCT} images/product, ${BULK_PRODUCT_PARALLEL} parallel, max ${BULK_MAX_PRODUCTS} products\n`);
});

server.setTimeout(1_200_000);
server.keepAliveTimeout = 1_200_000;
server.headersTimeout   = 1_210_000;
