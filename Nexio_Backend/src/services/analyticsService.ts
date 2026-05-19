import { MONGODB_URI } from '../config.js';
import { Event } from '../models/Event.js';
import { callTextModel } from './aiService.js';
import type { EventLog, StyleStat } from '../types.js';

const useMongo = !!MONGODB_URI;

export async function appendEvent(event: EventLog): Promise<void> {
  if (!useMongo) return;
  try { await Event.create(event); } catch (e) { console.warn('[analytics] insert failed:', e); }
}

export async function readEvents(category?: string): Promise<EventLog[]> {
  if (!useMongo) return [];
  const filter = category ? { category: new RegExp(`^${category}$`, 'i') } : {};
  return Event.find(filter).lean() as Promise<EventLog[]>;
}

export async function aggregateStyles(category?: string): Promise<StyleStat[]> {
  const events = await readEvents(category);
  const map = new Map<string, { downloads: number; favorites: number; copies: number }>();
  for (const e of events) {
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

const INTELLIGENCE_PROMPT = `You are Nexio Intelligence Engine. Analyze user interaction data and return actionable recommendations.
Scoring: score=(downloads*0.5)+(favorites*0.3)+(copies*0.2), normalized 0-5. Confidence: High/Medium/Low.
Return ONLY valid JSON, no markdown:
{"top_recommendations":[{"style":"","conversion_score":0,"confidence":"","usage_count":0,"reason":""}],"insights":[""],"best_variant":{"variant_id":"","style":"","reason":""}}`;

export async function runIntelligence(input: object): Promise<any> {
  const raw = await callTextModel(`${INTELLIGENCE_PROMPT}\n\nData:\n${JSON.stringify(input)}`);
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(cleaned); }
  catch { return { top_recommendations: [], insights: [], best_variant: null }; }
}
