import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

export const API_KEY = process.env.GEMINI_API_KEY!;
export const PORT    = Number(process.env.PORT) || 8080;

if (!API_KEY) { console.error('ERROR: GEMINI_API_KEY not set in .env'); process.exit(1); }

let _ai: GoogleGenAI | null = null;
export function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: API_KEY });
  return _ai;
}

export const DATA_DIR       = path.join(process.cwd(), 'data');
export const EVENTS_FILE    = path.join(DATA_DIR, 'events.jsonl');
export const STORES_FILE    = path.join(DATA_DIR, 'stores.json');
export const PUB_KITS_FILE  = path.join(DATA_DIR, 'published_kits.json');
export const STORE_IMGS_DIR = path.join(DATA_DIR, 'store-images');
export const CHAT_LOG_FILE  = path.join(DATA_DIR, 'chatlogs.jsonl');

for (const dir of [DATA_DIR, STORE_IMGS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
