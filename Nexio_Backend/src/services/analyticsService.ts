import fs from 'fs';
import { EVENTS_FILE } from '../config.js';
import { callTextModel } from './aiService.js';
import type { EventLog, StyleStat } from '../types.js';

export function appendEvent(event: EventLog): void {
  try { fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n'); }
  catch (e) { console.warn('[analytics] append failed:', e); }
}

export function readEvents(): EventLog[] {
  try {
    return fs.readFileSync(EVENTS_FILE, 'utf-8')
      .trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch { return []; }
}

export function aggregateStyles(category?: string): StyleStat[] {
  const events = readEvents();
  const relevant = category
    ? events.filter(e => e.category.toLowerCase() === category.toLowerCase())
    : events;
  const map = new Map<string, { downloads: number; favorites: number; copies: number }>();
  for (const e of relevant) {
    if (!e.style) continue;
    if (!map.has(e.style)) map.set(e.style, { downloads: 0, favorites: 0, copies: 0 });
    const s = map.get(e.style)!;
    if (e.event_type === 'download_image' || e.event_type === 'export_zip') s.downloads++;
    if (e.event_type === 'favorite_variant') s.favorites++;
    if (e.event_type === 'copy_listing')     s.copies++;
  }
  const raw = Array.from(map.entries()).map(([style, c]) => ({
    style, ...c, score: c.downloads * 0.5 + c.favorites * 0.3 + c.copies * 0.2,
  })).sort((a, b) => b.score - a.score);
  const maxScore = raw[0]?.score || 1;
  return raw.map(s => ({ ...s, score: parseFloat(((s.score / maxScore) * 5).toFixed(2)) }));
}

const INTELLIGENCE_PROMPT = `You are AdGenius Intelligence Engine. Analyze user interaction data and return actionable recommendations.
Scoring: score=(downloads*0.5)+(favorites*0.3)+(copies*0.2), normalized 0-5. Confidence: High/Medium/Low.
Return ONLY valid JSON, no markdown:
{"top_recommendations":[{"style":"","conversion_score":0,"confidence":"","usage_count":0,"reason":""}],"insights":[""],"best_variant":{"variant_id":"","style":"","reason":""}}`;

export async function runIntelligence(input: object): Promise<any> {
  const raw = await callTextModel(`${INTELLIGENCE_PROMPT}\n\nData:\n${JSON.stringify(input)}`);
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); }
  catch { return { top_recommendations: [], insights: [], best_variant: null }; }
}
