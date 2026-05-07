import { Router } from 'express';
import { appendEvent, aggregateStyles, runIntelligence } from '../services/analyticsService.js';

const router = Router();

router.post('/events', (req, res) => {
  appendEvent({
    user_id:    req.body.user_id    ?? 'anonymous',
    product_id: req.body.product_id ?? '',
    category:   req.body.category   ?? '',
    event_type: req.body.event_type ?? '',
    variant_id: req.body.variant_id ?? '',
    style:      req.body.style      ?? '',
    platform:   req.body.platform   ?? '',
    timestamp:  req.body.timestamp  ?? new Date().toISOString(),
  });
  res.json({ ok: true });
});

router.get('/analytics/styles', (req, res) => {
  const category = req.query.category as string | undefined;
  res.json({ category: category ?? 'all', styles: aggregateStyles(category) });
});

router.post('/intelligence/recommend', async (req, res) => {
  const { category, product_type } = req.body;
  const styles = aggregateStyles(category);
  if (styles.length < 2) {
    res.json({ top_recommendations: [], insights: ['Not enough data yet — keep using AdGenius to unlock insights.'], best_variant: null });
    return;
  }
  try {
    const result = await runIntelligence({ category: category ?? 'General', styles, context: { category, product_type } });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
