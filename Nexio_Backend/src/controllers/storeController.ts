import express, { Router, Request } from 'express';
import fs from 'fs';
import { loadStores, saveStores, loadPubKits, savePubKits, saveStoreImage, slugify } from '../services/storeService.js';
import { isRateLimited } from '../state.js';
import { callTextModel } from '../services/aiService.js';
import { CHAT_LOG_FILE } from '../config.js';

function base(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

function appendChatLog(log: object) {
  try { fs.appendFileSync(CHAT_LOG_FILE, JSON.stringify({ ...log, createdAt: new Date().toISOString() }) + '\n'); } catch {}
}

const SALES_SYSTEM = `You are an AI sales assistant for an online store.
Rules: Answer ONLY based on provided product data. If unsure, say "I'm not sure — please contact the seller."
Keep answers short and friendly. Never invent specs or process payments.
Always end: "To purchase, tap the Contact button to message the seller directly."`;

const router = Router();

router.post('/store/publish', async (req, res) => {
  const { userId, storeSlug, displayName, tagline, contactWhatsapp, contactEmail,
          kitId, productName, category, goal, thumbnailDataUri, imageDataUris, listing } = req.body;
  if (!userId || !storeSlug || !kitId) { res.status(400).json({ error: 'userId, storeSlug, kitId required' }); return; }
  const slug = slugify(storeSlug);
  if (!slug) { res.status(400).json({ error: 'Invalid store slug' }); return; }
  const stores   = loadStores();
  const existing = stores.find(s => s.storeSlug === slug);
  if (existing && existing.userId !== userId) { res.status(409).json({ error: 'Store slug already taken. Choose another.' }); return; }
  if (!existing) {
    stores.push({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      userId, storeSlug: slug,
      displayName: displayName || slug, tagline: tagline || '',
      contactWhatsapp: contactWhatsapp || '', contactEmail: contactEmail || '',
      isPublic: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  } else {
    const i = stores.indexOf(existing);
    stores[i] = { ...existing,
      displayName: displayName ?? existing.displayName, tagline: tagline ?? existing.tagline,
      contactWhatsapp: contactWhatsapp ?? existing.contactWhatsapp, contactEmail: contactEmail ?? existing.contactEmail,
      updatedAt: new Date().toISOString(),
    };
  }
  saveStores(stores);
  let thumbnailPath = '';
  const imagePaths: string[] = [];
  if (thumbnailDataUri?.startsWith('data:')) {
    thumbnailPath = `${kitId}-thumb.jpg`;
    try { saveStoreImage(thumbnailDataUri, thumbnailPath); } catch {}
  }
  for (let i = 0; i < (imageDataUris ?? []).length; i++) {
    const uri = imageDataUris[i];
    if (uri?.startsWith('data:')) { const fn = `${kitId}-${i}.jpg`; try { saveStoreImage(uri, fn); imagePaths.push(fn); } catch {} }
  }
  const kits        = loadPubKits();
  const existingKit = kits.find(k => k.id === kitId);
  const kitData = {
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
  res.json({ ok: true, storeSlug: slug, kitId, storeUrl: `${B}/store/${slug}`, productUrl: `${B}/store/${slug}/${kitId}` });
});

router.get('/store/manage/:userId', (req, res) => {
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

router.get('/store/:slug', (req, res) => {
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

router.get('/store/:slug/kit/:kitId', (req, res) => {
  const { slug, kitId } = req.params;
  const kit   = loadPubKits().find(k => k.storeSlug === slug && k.id === kitId && k.isPublished);
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

router.patch('/store/:slug/kit/:kitId/toggle', (req, res) => {
  const { slug, kitId } = req.params;
  const kits = loadPubKits();
  const kit  = kits.find(k => k.storeSlug === slug && k.id === kitId && k.userId === req.body.userId);
  if (!kit) { res.status(404).json({ error: 'Kit not found' }); return; }
  kit.isPublished = !kit.isPublished;
  savePubKits(kits);
  res.json({ ok: true, isPublished: kit.isPublished });
});

router.post('/store/chat', async (req, res) => {
  const ip = String(req.ip ?? req.socket.remoteAddress ?? '').replace(/^.*:/, '');
  if (isRateLimited(ip)) { res.status(429).json({ error: 'Too many messages. Please wait a moment.' }); return; }
  const { storeSlug, kitId, userMessage } = req.body;
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
    const text     = await callTextModel(prompt);
    const response = text.trim() || "I'm not sure — please contact the seller.";
    appendChatLog({ storeSlug, kitId, userMessage: userMessage.trim(), aiResponse: response });
    res.json({ response });
  } catch {
    res.status(500).json({ error: 'Assistant temporarily unavailable.' });
  }
});

export default router;
