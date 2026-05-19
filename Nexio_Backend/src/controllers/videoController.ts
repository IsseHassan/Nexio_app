import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { imageCache } from '../state.js';
import { callVideoModel } from '../services/aiService.js';
import { uploadVideoBuffer } from '../services/cloudinaryService.js';
import { CLOUDINARY_CLOUD, VIDEOS_DIR } from '../config.js';

const router = Router();
const useCloudinary = !!CLOUDINARY_CLOUD;

router.post('/generate-video', (req, res) => {
  res.setTimeout(360_000);
  const { sessionId, base64, mimeType, prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: 'prompt is required' }); return; }

  let imgBase64: string | undefined;
  let imgMimeType: string | undefined;
  if (sessionId) {
    const cached = imageCache.get(sessionId);
    if (cached) { cached.ts = Date.now(); imgBase64 = cached.base64; imgMimeType = cached.mimeType; }
  } else if (base64 && mimeType) {
    imgBase64 = base64; imgMimeType = mimeType;
  }

  const start = Date.now();
  callVideoModel(prompt, imgBase64, imgMimeType)
    .then(async (filename) => {
      console.log(`[video] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      if (useCloudinary) {
        try {
          const buf = fs.readFileSync(path.join(VIDEOS_DIR, filename));
          const videoUrl = await uploadVideoBuffer(buf, 'nexio/videos');
          fs.unlink(path.join(VIDEOS_DIR, filename), () => {});
          res.json({ videoUrl });
        } catch (uploadErr: any) {
          console.warn('[video] Cloudinary upload failed, serving locally:', uploadErr.message);
          res.json({ videoUrl: `/api/videos/${filename}` });
        }
      } else {
        res.json({ videoUrl: `/api/videos/${filename}` });
      }
    })
    .catch((err: any) => {
      console.error('[video] error:', err?.message);
      res.status(500).json({ error: err?.message ?? String(err) });
    });
});

export default router;
