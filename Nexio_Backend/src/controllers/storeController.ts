import { Router, Request } from 'express';
import { Store, Kit, slugify } from '../services/storeService.js';
import { uploadImage, uploadImageUrl } from '../services/cloudinaryService.js';
import { isRateLimited } from '../state.js';
import { callTextModel } from '../services/aiService.js';

const router = Router();

const SALES_SYSTEM = `You are an AI sales assistant for an online store.
Rules: Answer ONLY based on provided product data. If unsure, say "I'm not sure — please contact the seller."
Keep answers short and friendly. Never invent specs or process payments.
Always end: "To purchase, tap the Contact button to message the seller directly."`;

router.post('/store/publish', async (req, res) => {
  const {
    userId, storeSlug, displayName, tagline, contactWhatsapp, contactEmail,
    kitId, productName, category, goal, thumbnailDataUri, imageDataUris, listing,
  } = req.body;

  if (!userId || !storeSlug || !kitId) { res.status(400).json({ error: 'userId, storeSlug, kitId required' }); return; }
  const slug = slugify(storeSlug);
  if (!slug) { res.status(400).json({ error: 'Invalid store slug' }); return; }

  const existing = await Store.findOne({ storeSlug: slug });
  if (existing && existing.userId !== userId) { res.status(409).json({ error: 'Store slug already taken.' }); return; }

  await Store.findOneAndUpdate(
    { storeSlug: slug },
    { userId, storeSlug: slug, displayName: displayName || slug, tagline: tagline || '',
      contactWhatsapp: contactWhatsapp || '', contactEmail: contactEmail || '', isPublic: true },
    { upsert: true, new: true },
  );

  let thumbnailUrl = '';
  const imageUrls: string[] = [];

  if (thumbnailDataUri?.startsWith('data:')) {
    try {
      const [meta, b64] = thumbnailDataUri.split(',');
      const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      thumbnailUrl = await uploadImage(b64, mime, 'nexio/store-images');
    } catch (e) { console.warn('[store] thumb upload failed:', e); }
  }

  for (const uri of (imageDataUris ?? [])) {
    if (!uri?.startsWith('data:')) continue;
    try {
      const [meta, b64] = uri.split(',');
      const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      imageUrls.push(await uploadImage(b64, mime, 'nexio/store-images'));
    } catch {}
  }

  const listingData = {
    title:            listing?.title            || listing?.global?.title            || '',
    shortDescription: listing?.shortDescription || listing?.global?.short_description || '',
    longDescription:  listing?.longDescription  || listing?.global?.long_description  || '',
    bullets:          listing?.bullets          || listing?.amazon?.bullets           || [],
    keywords:         listing?.keywords         || listing?.global?.keywords          || [],
  };

  await Kit.findOneAndUpdate(
    { kitId },
    { kitId, storeSlug: slug, userId, isPublished: true,
      productName: productName || listingData.title || category || 'Product',
      category: category || 'General', goal: goal || 'full',
      thumbnailUrl, imageUrls, listing: listingData },
    { upsert: true, new: true },
  );

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    ok: true,
    storeSlug: slug,
    kitId,
    storeUrl:   `${baseUrl}/api/store/${slug}`,
    productUrl: `${baseUrl}/api/store/${slug}/kit/${kitId}`,
  });
});

router.get('/store/manage/:userId', async (req, res) => {
  const store = await Store.findOne({ userId: req.params.userId }).lean();
  if (!store) { res.json({ store: null, kits: [] }); return; }
  const kits = await Kit.find({ storeSlug: (store as any).storeSlug, userId: req.params.userId }).lean();
  res.json({
    store: { slug: (store as any).storeSlug, displayName: (store as any).displayName,
             tagline: (store as any).tagline, contactWhatsapp: (store as any).contactWhatsapp,
             contactEmail: (store as any).contactEmail, isPublic: (store as any).isPublic },
    kits: kits.map((k: any) => ({ id: k.kitId, productName: k.productName,
      isPublished: k.isPublished, thumbnailUrl: k.thumbnailUrl || null })),
  });
});

router.get('/store/:slug', async (req, res) => {
  const store = await Store.findOne({ storeSlug: req.params.slug, isPublic: true }).lean();
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }
  const kits = await Kit.find({ storeSlug: req.params.slug, isPublished: true }).lean();
  res.json({
    store: { slug: (store as any).storeSlug, displayName: (store as any).displayName,
             tagline: (store as any).tagline, contactWhatsapp: (store as any).contactWhatsapp,
             contactEmail: (store as any).contactEmail },
    kits: kits.map((k: any) => ({ id: k.kitId, productName: k.productName, category: k.category,
      thumbnailUrl: k.thumbnailUrl || null, shortDescription: k.listing.shortDescription })),
  });
});

router.get('/store/:slug/kit/:kitId', async (req, res) => {
  const kit = await Kit.findOne({ storeSlug: req.params.slug, kitId: req.params.kitId, isPublished: true }).lean();
  if (!kit) { res.status(404).json({ error: 'Product not found' }); return; }
  const store = await Store.findOne({ storeSlug: req.params.slug }).lean();
  res.json({
    kit: { id: (kit as any).kitId, productName: (kit as any).productName, category: (kit as any).category,
      thumbnailUrl: (kit as any).thumbnailUrl, imageUrls: (kit as any).imageUrls, listing: (kit as any).listing },
    store: store ? { slug: (store as any).storeSlug, displayName: (store as any).displayName,
      contactWhatsapp: (store as any).contactWhatsapp, contactEmail: (store as any).contactEmail } : null,
  });
});

router.patch('/store/:slug/kit/:kitId/toggle', async (req, res) => {
  const kit = await Kit.findOne({ storeSlug: req.params.slug, kitId: req.params.kitId, userId: req.body.userId });
  if (!kit) { res.status(404).json({ error: 'Kit not found' }); return; }
  kit.isPublished = !kit.isPublished;
  await kit.save();
  res.json({ ok: true, isPublished: kit.isPublished });
});

router.post('/store/chat', async (req, res) => {
  const ip = String(req.ip ?? req.socket.remoteAddress ?? '').replace(/^.*:/, '');
  if (isRateLimited(ip)) { res.status(429).json({ error: 'Too many messages. Please wait a moment.' }); return; }
  const { storeSlug, kitId, userMessage } = req.body;
  if (!storeSlug || !userMessage?.trim()) { res.status(400).json({ error: 'storeSlug and userMessage required' }); return; }

  let context = '';
  if (kitId) {
    const kit = await Kit.findOne({ kitId, storeSlug, isPublished: true }).lean() as any;
    if (kit) context = [
      `Product: ${kit.productName}`, `Category: ${kit.category}`,
      kit.listing.title && `Title: ${kit.listing.title}`,
      kit.listing.shortDescription && `Description: ${kit.listing.shortDescription}`,
      kit.listing.longDescription && `Details: ${kit.listing.longDescription.slice(0, 600)}`,
      kit.listing.bullets.length && `Features:\n${kit.listing.bullets.slice(0, 5).map((b: string) => `- ${b}`).join('\n')}`,
      kit.listing.keywords.length && `Keywords: ${kit.listing.keywords.slice(0, 8).join(', ')}`,
    ].filter(Boolean).join('\n');
  } else {
    const kits = await Kit.find({ storeSlug, isPublished: true }).limit(8).lean() as any[];
    context = `Store products:\n${kits.map(k => `- ${k.productName}: ${k.listing.shortDescription}`).join('\n')}`;
  }

  try {
    const prompt = `${SALES_SYSTEM}\n\nProduct data:\n${context || 'No product data.'}\n\nCustomer: ${userMessage.trim().slice(0, 500)}`;
    const text = await callTextModel(prompt);
    res.json({ response: text.trim() || "I'm not sure — please contact the seller." });
  } catch {
    res.status(500).json({ error: 'Assistant temporarily unavailable.' });
  }
});

export default router;
