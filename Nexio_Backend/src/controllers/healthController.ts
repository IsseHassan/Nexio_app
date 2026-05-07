import { Router } from 'express';
import { imageCache, activeImages, batchStore } from '../state.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'AI Studio', activeImages, cached: imageCache.size, batches: batchStore.size });
});

export default router;
