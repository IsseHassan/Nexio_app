import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Tag, ShoppingBag, Globe, Music, Hash, RefreshCcw } from 'lucide-react';
import type { ListingResult } from '../services/listingService';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handle} title="Copy"
      className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/60 transition-all flex-shrink-0">
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Editable text ────────────────────────────────────────────────────────────

function EditableText({
  value, onChange, bold = false, large = false,
}: {
  value: string;
  onChange: (v: string) => void;
  bold?: boolean;
  large?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
      ref.current.focus();
    }
  }, [editing]);

  function commit() { onChange(draft); setEditing(false); }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={e => {
          setDraft(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`w-full bg-transparent resize-none focus:outline-none border-b border-indigo-500/50 pb-1 leading-relaxed whitespace-pre-wrap
          ${bold ? 'font-semibold text-zinc-100' : 'text-zinc-300'}
          ${large ? 'text-base' : 'text-sm'}`}
        rows={1}
      />
    );
  }

  return (
    <p
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
      className={`cursor-text leading-relaxed whitespace-pre-wrap hover:opacity-75 transition-opacity
        ${bold ? 'font-semibold text-zinc-100' : 'text-zinc-300'}
        ${large ? 'text-base' : 'text-sm'}`}
    >
      {value}
    </p>
  );
}

// ─── Editable tags ────────────────────────────────────────────────────────────

function EditableTags({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  function addTag() {
    const tag = newTag.trim();
    if (tag) onChange([...items, tag]);
    setNewTag('');
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className="group flex items-center gap-1 px-2.5 py-1 bg-zinc-800 border border-zinc-700/60 rounded-full text-xs text-zinc-400">
          {t}
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-0.5 leading-none text-sm"
          >×</button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setAdding(false); setNewTag(''); } }}
          onBlur={addTag}
          className="px-2.5 py-1 bg-zinc-800 border border-indigo-500/50 rounded-full text-xs text-zinc-200 focus:outline-none w-28"
          placeholder="Add tag…"
        />
      ) : (
        <button onClick={() => setAdding(true)}
          className="px-2.5 py-1 bg-transparent border border-dashed border-zinc-700 rounded-full text-xs text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-all">
          + Add
        </button>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ label, copyText, children }: { label: string; copyText: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{label}</span>
        <CopyBtn text={copyText} />
      </div>
      {children}
    </div>
  );
}

// ─── Platforms ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'global',    label: 'Global',    Icon: Globe },
  { id: 'etsy',      label: 'Etsy',      Icon: Tag },
  { id: 'amazon',    label: 'Amazon',    Icon: ShoppingBag },
  { id: 'instagram', label: 'Instagram', Icon: Hash },
  { id: 'tiktok',    label: 'TikTok',    Icon: Music },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

// ─── Copy All button ──────────────────────────────────────────────────────────

function CopyAllBtn({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }
  return (
    <button onClick={handle}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-bold text-zinc-300 hover:text-white transition-colors">
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {copied ? 'Copied!' : 'Copy All'}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ListingPanel({
  listing,
  isGenerating,
  error,
  onRegenerate,
  onCopyPlatform,
}: {
  listing: ListingResult | null;
  isGenerating: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  onCopyPlatform?: (platform: string) => void;
}) {
  const [platform, setPlatform] = useState<PlatformId>('global');
  const [local, setLocal] = useState<ListingResult | null>(listing);

  useEffect(() => { setLocal(listing); }, [listing]);

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600">
        <motion.div className="w-12 h-12 rounded-full border-t-2 border-indigo-500"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
        <p className="text-xs uppercase tracking-widest font-bold">Generating listing…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <p className="text-red-400 text-sm font-medium">Listing generation failed</p>
        <p className="text-zinc-600 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 max-w-lg text-left break-all">{error}</p>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-700">
        <ShoppingBag size={40} strokeWidth={1} />
        <p className="text-sm">Upload a product image and click Generate Listing</p>
      </div>
    );
  }

  const { product_analysis: pa, global: g, etsy, amazon, instagram, tiktok } = local;

  const patchGlobal    = (p: Partial<typeof g>)         => setLocal(prev => prev ? { ...prev, global: { ...prev.global, ...p } } : prev);
  const patchEtsy      = (p: Partial<typeof etsy>)      => setLocal(prev => prev ? { ...prev, etsy: { ...prev.etsy, ...p } } : prev);
  const patchEtsyDesc  = (p: Partial<typeof etsy.description>) => setLocal(prev => prev ? { ...prev, etsy: { ...prev.etsy, description: { ...prev.etsy.description, ...p } } } : prev);
  const patchAmazon    = (p: Partial<typeof amazon>)    => setLocal(prev => prev ? { ...prev, amazon: { ...prev.amazon, ...p } } : prev);
  const patchInstagram = (p: Partial<typeof instagram>) => setLocal(prev => prev ? { ...prev, instagram: { ...prev.instagram, ...p } } : prev);
  const patchTiktok    = (p: Partial<typeof tiktok>)    => setLocal(prev => prev ? { ...prev, tiktok: { ...prev.tiktok, ...p } } : prev);

  function copyAll(): string {
    switch (platform) {
      case 'global':    return [g.title, g.short_description, g.long_description, g.keywords.join(', ')].join('\n\n');
      case 'etsy':      return [etsy.title, etsy.tags.join(', '), ...Object.values(etsy.description).filter(Boolean)].join('\n\n');
      case 'amazon':    return [amazon.title, amazon.bullets.join('\n'), amazon.description, amazon.backend_keywords.join(', ')].join('\n\n');
      case 'instagram': return [instagram.caption, instagram.hashtags.join(' ')].join('\n\n');
      case 'tiktok':    return [tiktok.hook, tiktok.caption, tiktok.hashtags.join(' ')].join('\n\n');
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Product analysis strip */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-zinc-800/60">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">Product Analysis</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(pa) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg text-xs">
              <span className="text-zinc-600 capitalize">{k.replace(/_/g, ' ')}:</span>
              <span className="text-zinc-300 font-medium">{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex-shrink-0 flex gap-1.5 px-6 py-3 border-b border-zinc-800">
        {PLATFORMS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setPlatform(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              platform === id ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={platform}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.13 }}>

            {platform === 'global' && (
              <>
                <Card label="Title" copyText={g.title}>
                  <EditableText bold value={g.title} onChange={v => patchGlobal({ title: v })} />
                </Card>
                <Card label="Short Description" copyText={g.short_description}>
                  <EditableText value={g.short_description} onChange={v => patchGlobal({ short_description: v })} />
                </Card>
                <Card label="Long Description" copyText={g.long_description}>
                  <EditableText value={g.long_description} onChange={v => patchGlobal({ long_description: v })} />
                </Card>
                <Card label="Keywords" copyText={g.keywords.join(', ')}>
                  <EditableTags items={g.keywords} onChange={v => patchGlobal({ keywords: v })} />
                </Card>
              </>
            )}

            {platform === 'etsy' && (
              <>
                <Card label="Title" copyText={etsy.title}>
                  <EditableText bold value={etsy.title} onChange={v => patchEtsy({ title: v })} />
                </Card>
                <Card label="Tags" copyText={etsy.tags.join(', ')}>
                  <EditableTags items={etsy.tags} onChange={v => patchEtsy({ tags: v })} />
                </Card>
                {(Object.entries(etsy.description) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
                  <Card key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} copyText={v}>
                    <EditableText value={v} onChange={nv => patchEtsyDesc({ [k]: nv })} />
                  </Card>
                ))}
              </>
            )}

            {platform === 'amazon' && (
              <>
                <Card label="Title" copyText={amazon.title}>
                  <EditableText bold value={amazon.title} onChange={v => patchAmazon({ title: v })} />
                </Card>
                <Card label="Bullet Points" copyText={amazon.bullets.join('\n')}>
                  <div className="space-y-2">
                    {amazon.bullets.map((b, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-indigo-400 font-bold mt-0.5 flex-shrink-0 text-sm">•</span>
                        <div className="flex-1">
                          <EditableText value={b} onChange={v => patchAmazon({ bullets: amazon.bullets.map((x, j) => j === i ? v : x) })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card label="Description" copyText={amazon.description}>
                  <EditableText value={amazon.description} onChange={v => patchAmazon({ description: v })} />
                </Card>
                <Card label="Backend Keywords" copyText={amazon.backend_keywords.join(', ')}>
                  <EditableTags items={amazon.backend_keywords} onChange={v => patchAmazon({ backend_keywords: v })} />
                </Card>
              </>
            )}

            {platform === 'instagram' && (
              <>
                <Card label="Caption" copyText={instagram.caption}>
                  <EditableText value={instagram.caption} onChange={v => patchInstagram({ caption: v })} />
                </Card>
                <Card label="Hashtags" copyText={instagram.hashtags.join(' ')}>
                  <EditableTags items={instagram.hashtags} onChange={v => patchInstagram({ hashtags: v })} />
                </Card>
              </>
            )}

            {platform === 'tiktok' && tiktok && (
              <>
                <Card label="Hook" copyText={tiktok.hook}>
                  <EditableText bold value={tiktok.hook} onChange={v => patchTiktok({ hook: v })} />
                </Card>
                <Card label="Caption" copyText={tiktok.caption}>
                  <EditableText value={tiktok.caption} onChange={v => patchTiktok({ caption: v })} />
                </Card>
                <Card label="Hashtags" copyText={tiktok.hashtags.join(' ')}>
                  <EditableTags items={tiktok.hashtags} onChange={v => patchTiktok({ hashtags: v })} />
                </Card>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
        <CopyAllBtn text={copyAll()} onCopy={() => onCopyPlatform?.(platform)} />
        {onRegenerate && (
          <button onClick={onRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
            <RefreshCcw size={14} />
            Regenerate
          </button>
        )}
      </div>

    </div>
  );
}
