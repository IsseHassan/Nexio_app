import { Router } from 'express';
import { imageCache } from '../state.js';
import { callMeshy3D } from '../services/aiService.js';

const router = Router();

router.post('/generate-3d', (req, res) => {
  res.setTimeout(420_000);
  const { sessionId, base64, mimeType } = req.body;

  let imgBase64: string, imgMimeType: string;
  if (sessionId) {
    const cached = imageCache.get(sessionId);
    if (!cached) { res.status(400).json({ error: 'Image session expired' }); return; }
    cached.ts = Date.now();
    imgBase64 = cached.base64;
    imgMimeType = cached.mimeType;
  } else if (base64 && mimeType) {
    imgBase64 = base64;
    imgMimeType = mimeType;
  } else {
    res.status(400).json({ error: 'Provide sessionId or base64+mimeType' }); return;
  }

  const start = Date.now();
  callMeshy3D(imgBase64, imgMimeType)
    .then(result => {
      console.log(`[3d] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      res.json(result);
    })
    .catch((err: any) => {
      console.error('[3d] error:', err?.message);
      res.status(500).json({ error: err?.message ?? String(err) });
    });
});

export default router;
