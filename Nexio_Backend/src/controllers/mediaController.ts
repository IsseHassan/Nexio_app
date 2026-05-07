import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { transcribeAudio, analyzeVideo, analyzeMultiAngle } from '../services/mediaService.js';

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename:    (_req, file, cb) => cb(null, `media-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

const router = Router();

router.post('/media/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/m4a' } = req.body;
    if (!audioBase64) { res.status(400).json({ error: 'audioBase64 required' }); return; }
    const transcript = await transcribeAudio(audioBase64, mimeType);
    res.json({ transcript });
  } catch (err: any) {
    console.error('transcribe error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Transcription failed' });
  }
});

router.post('/media/upload-video', upload.single('video'), async (req, res) => {
  try {
    let videoBase64: string;
    let mimeType: string;
    if (req.file) {
      videoBase64 = fs.readFileSync(req.file.path).toString('base64');
      mimeType    = req.file.mimetype || 'video/mp4';
      fs.unlink(req.file.path, () => {});
    } else if (req.body.base64) {
      videoBase64 = req.body.base64;
      mimeType    = req.body.mimeType || 'video/mp4';
    } else {
      res.status(400).json({ error: 'Provide video file (multipart) or base64 in body' }); return;
    }
    const description = await analyzeVideo(videoBase64, mimeType);
    res.json({ description });
  } catch (err: any) {
    console.error('upload-video error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Video analysis failed' });
  }
});

router.post('/media/analyze-angles', async (req, res) => {
  try {
    const { images, userText } = req.body as {
      images: Array<{ base64: string; mimeType: string }>;
      userText?: string;
    };
    if (!images?.length) { res.status(400).json({ error: 'images array required' }); return; }
    const result = await analyzeMultiAngle(images, userText);
    res.json(result);
  } catch (err: any) {
    console.error('analyze-angles error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Analysis failed' });
  }
});

export default router;
