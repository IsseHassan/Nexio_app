import { Router, Request, Response } from 'express';
import { UserKit } from '../models/UserKit.js';
import { requireAuth } from './authController.js';
import { MONGODB_URI } from '../config.js';

const router = Router();

function noDb(res: Response): boolean {
  if (!MONGODB_URI) { res.status(503).json({ error: 'Database not configured' }); return true; }
  return false;
}

router.post('/kits', requireAuth, async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const userId = (req as any).userId;
  const { category, goal, name, thumbnailUrl, variations, listingResult, productAnalysis } = req.body;
  try {
    const kit = await UserKit.create({ userId, category, goal, name, thumbnailUrl, variations, listingResult, productAnalysis });
    res.status(201).json({ kit: { id: kit._id, createdAt: kit.createdAt } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kits', requireAuth, async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const userId = (req as any).userId;
  try {
    const kits = await (UserKit as any).find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ kits: kits.map((k: any) => ({
      id: k._id,
      createdAt: k.createdAt,
      category: k.category,
      goal: k.goal,
      name: k.name,
      thumbnailUrl: k.thumbnailUrl,
      imageCount: (k.variations ?? []).filter((v: any) => v.status === 'completed').length,
      hasListing: !!k.listingResult,
      hasSocial: !!(k.listingResult?.instagram || k.listingResult?.tiktok),
    })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kits/:id', requireAuth, async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const userId = (req as any).userId;
  try {
    const kit = await (UserKit as any).findOne({ _id: req.params.id, userId }).lean();
    if (!kit) return void res.status(404).json({ error: 'Kit not found' });
    res.json({ kit: { ...kit, id: kit._id } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/kits/:id', requireAuth, async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const userId = (req as any).userId;
  try {
    await (UserKit as any).deleteOne({ _id: req.params.id, userId });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
