import { Router } from 'express';
import { callTextModel } from '../services/aiService.js';

const router = Router();

router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, image } = req.body;
    const text = await callTextModel(prompt, image?.base64, image?.mimeType);
    res.json({ text });
  } catch (err: any) {
    console.error('generate-text error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Text generation failed' });
  }
});

export default router;
