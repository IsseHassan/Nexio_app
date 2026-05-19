import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { imageCache } from '../state.js';
import { callVideoModel } from '../services/aiService.js';
import { uploadVideoBuffer } from '../services/cloudinaryService.js';
import { CLOUDINARY_CLOUD, VIDEOS_DIR } from '../config.js';
import { UserVideo } from '../models/UserVideo.js';

const router = Router();
const useCloudinary = !!CLOUDINARY_CLOUD;

router.post('/generate-video', (req, res) => {
  res.setTimeout(360_000);
  const { sessionId, base64, mimeType, prompt, userId } = req.body;
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
      let videoUrl: string;
      if (useCloudinary) {
        try {
          const buf = fs.readFileSync(path.join(VIDEOS_DIR, filename));
          videoUrl = await uploadVideoBuffer(buf, 'nexio/videos');
          fs.unlink(path.join(VIDEOS_DIR, filename), () => {});
        } catch (uploadErr: any) {
          console.warn('[video] Cloudinary upload failed, serving locally:', uploadErr.message);
          videoUrl = `/api/videos/${filename}`;
        }
      } else {
        videoUrl = `/api/videos/${filename}`;
      }

      if (userId) {
        UserVideo.create({ userId, videoUrl, prompt }).catch((e: any) =>
          console.warn('[video] failed to save to history:', e.message),
        );
      }

      res.json({ videoUrl });
    })
    .catch((err: any) => {
      console.error('[video] error:', err?.message);
      res.status(500).json({ error: err?.message ?? String(err) });
    });
});

router.get('/user-videos/:userId', async (req, res) => {
  try {
    const videos = await UserVideo.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({
      videos: videos.map((v: any) => ({
        id: v._id,
        videoUrl: v.videoUrl,
        prompt: v.prompt,
        createdAt: v.createdAt,
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
