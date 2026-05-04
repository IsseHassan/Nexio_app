import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import type { IntelligenceResult } from '../services/analyticsService';

const CONFIDENCE: Record<string, string> = {
  High:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  Low:    'text-zinc-400   bg-zinc-700/30   border-zinc-700',
};

export function InsightsPanel({ data, category }: { data: IntelligenceResult; category: string }) {
  const { top_recommendations: recs, insights } = data;
  if (!recs.length && !insights.filter(i => !i.includes('Not enough')).length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <TrendingUp size={12} className="text-indigo-400" />
        <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
          Top Styles · {category}
        </span>
      </div>

      {recs.slice(0, 3).map(rec => (
        <div key={rec.style}
          className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-200 truncate">{rec.style}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 capitalize ${CONFIDENCE[rec.confidence] ?? CONFIDENCE.Low}`}>
              {rec.confidence}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j}
                  className={`w-2 h-2 rounded-sm transition-colors ${j < Math.round(rec.conversion_score) ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{rec.conversion_score.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-600">· {rec.usage_count.toLocaleString()} uses</span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">{rec.reason}</p>
        </div>
      ))}

      {insights.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {insights.slice(0, 3).map((insight, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Zap size={10} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-zinc-500 leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
