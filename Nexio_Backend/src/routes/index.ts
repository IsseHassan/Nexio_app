import express, { Router } from 'express';
import { STORE_IMGS_DIR } from '../config.js';
import healthRouter    from '../controllers/healthController.js';
import imageRouter     from '../controllers/imageController.js';
import textRouter      from '../controllers/textController.js';
import analyticsRouter from '../controllers/analyticsController.js';
import bulkRouter      from '../controllers/bulkController.js';
import storeRouter     from '../controllers/storeController.js';
import mediaRouter     from '../controllers/mediaController.js';

const router = Router();

router.use('/store-images', express.static(STORE_IMGS_DIR));
router.use('/api', healthRouter);
router.use('/api', imageRouter);
router.use('/api', textRouter);
router.use('/api', analyticsRouter);
router.use('/api', bulkRouter);
router.use('/api', storeRouter);
router.use('/api', mediaRouter);

export default router;
