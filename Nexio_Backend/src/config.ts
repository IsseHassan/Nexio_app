import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

export const API_KEY           = process.env.GEMINI_API_KEY!;
export const MESHY_API_KEY     = process.env.MESHY_API_KEY ?? '';
export const MONGODB_URI       = process.env.MONGODB_URI ?? '';
export const CLOUDINARY_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_KEY    = process.env.CLOUDINARY_API_KEY ?? '';
export const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET ?? '';
export const JWT_SECRET        = process.env.JWT_SECRET || 'nexio-dev-secret-change-in-prod';
export const PORT              = Number(process.env.PORT) || 8080;

if (!API_KEY) { console.error('ERROR: GEMINI_API_KEY not set in .env'); process.exit(1); }

let _ai: GoogleGenAI | null = null;
export function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: API_KEY });
  return _ai;
}

export const DATA_DIR       = path.join(process.cwd(), 'data');
export const VIDEOS_DIR     = path.join(DATA_DIR, 'videos');
export const STORE_IMGS_DIR = path.join(DATA_DIR, 'store-images');
for (const dir of [DATA_DIR, VIDEOS_DIR, STORE_IMGS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
