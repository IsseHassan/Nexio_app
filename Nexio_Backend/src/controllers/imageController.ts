import { Router } from 'express';
import { imageCache, withConcurrency } from '../state.js';
import { callImageModel } from '../services/aiService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { CLOUDINARY_CLOUD } from '../config.js';

const useCloudinary = !!CLOUDINARY_CLOUD;

async function toImageUrl(base64DataUri: string): Promise<string> {
  if (!useCloudinary) return base64DataUri;
  const [meta, b64] = base64DataUri.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  try {
    return await uploadImage(b64, mime, 'nexio/generated');
  } catch (err: any) {
    console.warn('[image] Cloudinary upload failed, returning base64:', err.message);
    return base64DataUri;
  }
}

const router = Router();

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

router.get('/style-presets', (_req, res) => res.json({ presets: STYLE_PRESETS }));

router.post('/cache-image', (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64 || !mimeType) { res.status(400).json({ error: 'base64 and mimeType required' }); return; }
  const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  imageCache.set(sessionId, { base64, mimeType, ts: Date.now() });
  console.log(`[cache] ${sessionId} stored — ${Math.round(base64.length * 0.75 / 1024)}KB`);
  res.json({ sessionId });
});

router.post('/generate-image', (req, res) => {
  res.setTimeout(600_000);
  const { sessionId, base64, mimeType, prompt } = req.body;
  let imgBase64: string, imgMimeType: string;
  if (sessionId) {
    const cached = imageCache.get(sessionId);
    if (!cached) { res.status(400).json({ error: 'Image session expired. Please restart generation.' }); return; }
    cached.ts = Date.now();
    imgBase64 = cached.base64;
    imgMimeType = cached.mimeType;
  } else if (base64 && mimeType) {
    imgBase64 = base64; imgMimeType = mimeType;
  } else {
    res.status(400).json({ error: 'Provide sessionId or base64+mimeType' }); return;
  }
  const start = Date.now();
  withConcurrency(() => callImageModel(imgBase64, imgMimeType, prompt))
    .then(base64DataUri => toImageUrl(base64DataUri))
    .then(imageUrl => {
      console.log(`[image] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      res.json({ imageUrl });
    })
    .catch((err: any) => {
      console.error('generate-image error:', err?.message);
      res.status(500).json({ error: err?.message ?? String(err) });
    });
});

export default router;
