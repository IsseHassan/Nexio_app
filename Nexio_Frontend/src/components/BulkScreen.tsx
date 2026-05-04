import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  RefreshCcw, Archive, Clock, ArrowRight, X, Layers,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UploadedItem {
  id: string;
  sku: string;
  imageFilename: string;
  category: string;
  customNotes: string;
  status: string;
  errorMessage?: string;
  imageMatched: boolean;
}

interface ValidationError {
  row: number;
  sku: string;
  error: string;
}

interface UploadResult {
  batchId: string;
  summary: { total: number; ready: number; missingImages: number };
  validationErrors: ValidationError[];
  items: UploadedItem[];
}

interface StatusItem {
  id: string;
  sku: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

interface BatchStatus {
  id: string;
  status: 'ready' | 'processing' | 'completed' | 'partial_failed' | 'failed';
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  items: StatusItem[];
  startedAt?: number;
  completedAt?: number;
}

interface DropzoneProps {
  getRootProps: () => React.HTMLAttributes<HTMLElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  isDragActive: boolean;
}

// ── Step 1: Upload ─────────────────────────────────────────────────────────────

interface Step1Props {
  csvFile: File | null;
  imageFiles: File[];
  brandStyleNotes: string;
  csvDrop: DropzoneProps;
  imagesDrop: DropzoneProps;
  setBrandStyleNotes: (v: string) => void;
  removeImage: (name: string) => void;
  uploading: boolean;
  uploadError: string | null;
  onUpload: () => void;
}

function Step1({
  csvFile, imageFiles, brandStyleNotes, csvDrop, imagesDrop,
  setBrandStyleNotes, removeImage, uploading, uploadError, onUpload,
}: Step1Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-white mb-1">Upload Batch Files</h2>
        <p className="text-sm text-zinc-500">Upload a CSV manifest and your product images to start bulk generation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CSV dropzone */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Product CSV *</label>
          <div {...csvDrop.getRootProps()}
            className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[140px] ${
              csvDrop.isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : csvFile
                  ? 'border-emerald-600/50 bg-emerald-600/5'
                  : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
            }`}>
            <input {...csvDrop.getInputProps()} />
            {csvFile ? (
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-600/30 flex items-center justify-center mx-auto mb-2">
                  <FileText size={18} className="text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-zinc-200 truncate max-w-[180px]">{csvFile.name}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{(csvFile.size / 1024).toFixed(0)} KB · Click to replace</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <FileText size={18} className="text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">Drop CSV file</p>
                  <p className="text-xs text-zinc-600 mt-0.5">or click to browse</p>
                </div>
              </>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">Required columns</p>
            <code className="text-[11px] text-indigo-400 font-mono">sku, image_filename, category</code>
            <p className="text-[10px] text-zinc-600 mt-1.5">Optional: <span className="font-mono">custom_notes</span></p>
          </div>
        </div>

        {/* Images dropzone */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
            Product Images <span className="text-zinc-700 normal-case font-normal">({imageFiles.length} added)</span>
          </label>
          <div {...imagesDrop.getRootProps()}
            className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[140px] ${
              imagesDrop.isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : imageFiles.length > 0
                  ? 'border-indigo-600/30 bg-indigo-600/5'
                  : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
            }`}>
            <input {...imagesDrop.getInputProps()} />
            {imageFiles.length > 0 ? (
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-600/30 flex items-center justify-center mx-auto mb-2">
                  <Layers size={18} className="text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-zinc-200">{imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} added</p>
                <p className="text-xs text-indigo-400 mt-0.5">Click or drop to add more</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Upload size={18} className="text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">Drop product images</p>
                  <p className="text-xs text-zinc-600 mt-0.5">JPG, PNG, WEBP · up to 25 MB each</p>
                </div>
              </>
            )}
          </div>
          {imageFiles.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
              {imageFiles.map(f => (
                <div key={f.name}
                  className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-800/40 px-2.5 py-1.5 rounded-md">
                  <span className="truncate max-w-[180px]">{f.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); removeImage(f.name); }}
                    className="ml-2 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Brand style notes */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
          Brand Style Notes <span className="text-zinc-700 normal-case font-normal">— optional, applied to all products</span>
        </label>
        <textarea
          value={brandStyleNotes}
          onChange={e => setBrandStyleNotes(e.target.value)}
          placeholder="e.g. minimalist aesthetic, neutral tones, avoid text overlays, premium lifestyle feel…"
          rows={3}
          className="w-full bg-zinc-900/70 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none resize-none"
        />
      </div>

      {uploadError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{uploadError}</p>
        </div>
      )}

      <button onClick={onUpload} disabled={!csvFile || uploading}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
          !csvFile || uploading
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
        }`}>
        {uploading
          ? <><RefreshCcw size={15} className="animate-spin" />Validating…</>
          : <>Upload &amp; Validate <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

// ── Step 2: Review ─────────────────────────────────────────────────────────────

interface Step2Props {
  result: UploadResult;
  editedNotes: string;
  setEditedNotes: (v: string) => void;
  startError: string | null;
  onBack: () => void;
  onStart: () => void;
}

function Step2({ result, editedNotes, setEditedNotes, startError, onBack, onStart }: Step2Props) {
  const { summary, validationErrors, items } = result;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">Review Batch</h2>
          <p className="text-sm text-zinc-500">Confirm detected items before starting generation.</p>
        </div>
        <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1">
          ← Change files
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Products',  value: summary.total,         color: 'text-white' },
          { label: 'Ready',           value: summary.ready,         color: 'text-emerald-400' },
          { label: 'Missing Images',  value: summary.missingImages, color: summary.missingImages > 0 ? 'text-amber-400' : 'text-zinc-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Validation warnings */}
      {validationErrors.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-2">Validation Warnings</p>
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-amber-400/80">Row {e.row} — {e.sku}: {e.error}</p>
          ))}
        </div>
      )}

      {/* Items table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] px-4 py-2.5 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          <span>SKU</span><span>Category</span><span>Image file</span><span>Status</span>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/60">
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] px-4 py-3 items-center">
              <span className="font-mono text-xs text-zinc-200 truncate">{item.sku}</span>
              <span className="text-xs text-zinc-400">{item.category}</span>
              <span className="text-xs text-zinc-500 truncate">{item.imageFilename}</span>
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${item.imageMatched ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.imageMatched
                  ? <><CheckCircle2 size={12} />Ready</>
                  : <><XCircle size={12} />No image</>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Brand style notes (editable) */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Brand Style Notes</label>
        <textarea
          value={editedNotes}
          onChange={e => setEditedNotes(e.target.value)}
          placeholder="Optional brand style guidance for all products…"
          rows={2}
          className="w-full bg-zinc-900/70 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none resize-none"
        />
      </div>

      {summary.ready === 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">No products have matching images. Go back and upload the correct image files.</p>
        </div>
      )}

      {startError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{startError}</p>
        </div>
      )}

      <button onClick={onStart} disabled={summary.ready === 0}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
          summary.ready === 0
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
        }`}>
        Start Generation for {summary.ready} product{summary.ready !== 1 ? 's' : ''} <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ── Step 3: Progress ────────────────────────────────────────────────────────────

function Step3({ status, progress }: { status: BatchStatus | null; progress: number }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-white mb-1">Generating…</h2>
        <p className="text-sm text-zinc-500">
          Your product images and listings are being generated. This takes about 30–60 seconds per product.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCcw size={14} className="text-indigo-400 animate-spin" />
            <span className="text-sm font-medium text-zinc-300">
              {status ? `${status.completed} of ${status.total} completed` : 'Starting…'}
            </span>
          </div>
          <span className="text-2xl font-bold text-white font-mono">{progress}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {status && (
          <div className="flex gap-5 mt-3 text-[11px]">
            <span className="text-emerald-400">✓ {status.completed} done</span>
            {status.processing > 0 && <span className="text-indigo-400">⟳ {status.processing} processing</span>}
            {status.pending > 0 && <span className="text-zinc-500">◦ {status.pending} queued</span>}
            {status.failed > 0 && <span className="text-red-400">✗ {status.failed} failed</span>}
          </div>
        )}
      </div>

      {/* Item grid */}
      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {status.items.map(item => (
            <div key={item.id}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 border text-xs transition-colors ${
                item.status === 'completed' ? 'bg-emerald-600/8 border-emerald-600/25 text-emerald-400' :
                item.status === 'processing' ? 'bg-indigo-600/8 border-indigo-600/25 text-indigo-400' :
                item.status === 'failed'     ? 'bg-red-500/8 border-red-500/25 text-red-400' :
                'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}>
              <div className="flex-shrink-0">
                {item.status === 'completed'  && <CheckCircle2 size={14} />}
                {item.status === 'processing' && <RefreshCcw size={14} className="animate-spin" />}
                {item.status === 'failed'     && <XCircle size={14} />}
                {item.status === 'pending'    && <Clock size={14} />}
              </div>
              <div className="min-w-0">
                <p className="font-mono font-bold truncate">{item.sku}</p>
                <p className="text-[10px] opacity-60 capitalize">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-600 flex items-center gap-2">
        <Clock size={12} />
        Results are saved server-side for 2 hours — you can safely leave this page.
      </p>
    </div>
  );
}

// ── Step 4: Download ────────────────────────────────────────────────────────────

interface Step4Props {
  status: BatchStatus;
  onRetry: () => void;
  onDownload: () => void;
  onReset: () => void;
}

function Step4({ status, onRetry, onDownload, onReset }: Step4Props) {
  const isFullSuccess = status.status === 'completed';
  const elapsed = status.startedAt && status.completedAt
    ? Math.round((status.completedAt - status.startedAt) / 1000)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isFullSuccess
              ? 'bg-emerald-600/15 border border-emerald-600/30'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
          {isFullSuccess
            ? <CheckCircle2 size={32} className="text-emerald-400" />
            : <AlertCircle size={32} className="text-amber-400" />}
        </motion.div>
        <h2 className="text-2xl font-light tracking-tight text-white mb-2">
          {isFullSuccess ? 'Batch Complete!' : 'Partially Complete'}
        </h2>
        <p className="text-sm text-zinc-500">
          {isFullSuccess
            ? `All ${status.completed} products generated successfully.`
            : `${status.completed} of ${status.total} products completed. ${status.failed} failed.`}
          {elapsed ? ` Finished in ${elapsed}s.` : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Completed', value: status.completed, color: 'text-emerald-400' },
          { label: 'Failed',    value: status.failed,    color: status.failed > 0 ? 'text-red-400' : 'text-zinc-600' },
          { label: 'Total',     value: status.total,     color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Results list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          Results
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/60">
          {status.items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-300">{item.sku}</span>
                <span className="text-[10px] text-zinc-600">{item.category}</span>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                item.status === 'completed' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {item.status === 'completed'
                  ? <><CheckCircle2 size={12} />Done</>
                  : <><XCircle size={12} /><span className="truncate max-w-[160px]">{item.errorMessage ?? 'Failed'}</span></>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {status.completed > 0 && (
          <button onClick={onDownload}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
            <Archive size={15} />
            Download ZIP
          </button>
        )}
        {status.failed > 0 && (
          <button onClick={onRetry}
            className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl font-bold text-sm transition-all">
            <RefreshCcw size={14} />
            Retry Failed ({status.failed})
          </button>
        )}
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-xl font-bold text-sm transition-all">
          New Batch
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BulkScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [brandStyleNotes, setBrandStyleNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2
  const [batchId, setBatchId] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [startError, setStartError] = useState<string | null>(null);

  // Step 3
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for status when on step 3
  useEffect(() => {
    if (step !== 3 || !batchId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/bulk/${batchId}`);
        if (!res.ok) return;
        const data: BatchStatus = await res.json();
        setBatchStatus(data);
        if (['completed', 'partial_failed', 'failed'].includes(data.status)) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setTimeout(() => setStep(4), 600);
        }
      } catch {}
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, batchId]);

  const onDropCSV = useCallback((files: File[]) => {
    if (files[0]) setCsvFile(files[0]);
  }, []);

  const onDropImages = useCallback((files: File[]) => {
    setImageFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !existing.has(f.name))];
    });
  }, []);

  const csvDrop = useDropzone({
    onDrop: onDropCSV,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] } as any,
    multiple: false,
  });

  const imagesDrop = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] } as any,
    multiple: true,
  });

  async function handleUpload() {
    if (!csvFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('csv', csvFile);
      for (const img of imageFiles) form.append('images', img);
      if (brandStyleNotes) form.append('brandStyleNotes', brandStyleNotes);

      const res = await fetch('/api/bulk/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setUploadResult(data);
      setBatchId(data.batchId);
      setEditedNotes(brandStyleNotes);
      setStep(2);
    } catch (e: any) {
      setUploadError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleStart() {
    if (!batchId) return;
    setStartError(null);
    try {
      const res = await fetch(`/api/bulk/${batchId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandStyleNotes: editedNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Start failed');
      setStep(3);
    } catch (e: any) {
      setStartError(e.message ?? 'Failed to start generation');
    }
  }

  async function handleRetry() {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/bulk/${batchId}/retry-failed`, { method: 'POST' });
      if (!res.ok) return;
      setBatchStatus(null);
      setStep(3);
    } catch {}
  }

  function handleDownload() {
    if (batchId) window.location.href = `/api/bulk/${batchId}/download`;
  }

  function handleReset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setCsvFile(null);
    setImageFiles([]);
    setBrandStyleNotes('');
    setBatchId(null);
    setUploadResult(null);
    setBatchStatus(null);
    setUploadError(null);
    setStartError(null);
    setEditedNotes('');
    setStep(1);
  }

  const progress = batchStatus
    ? Math.round((batchStatus.completed / Math.max(batchStatus.total, 1)) * 100)
    : 0;

  const STEP_LABELS = ['Upload', 'Review', 'Generate', 'Download'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Step indicator */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-8 py-4 bg-zinc-950/30">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as 1 | 2 | 3 | 4;
            const active = step === s;
            const done = step > s;
            return (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 transition-colors ${
                  active ? 'text-white' : done ? 'text-emerald-400' : 'text-zinc-600'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors ${
                    active ? 'bg-indigo-600 border-indigo-500 text-white' :
                    done   ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' :
                    'bg-zinc-800 border-zinc-700 text-zinc-600'
                  }`}>
                    {done ? '✓' : s}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block">{label}</span>
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-px max-w-16 transition-colors ${step > s ? 'bg-emerald-600/40' : 'bg-zinc-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Step1
                csvFile={csvFile} imageFiles={imageFiles} brandStyleNotes={brandStyleNotes}
                csvDrop={csvDrop as DropzoneProps} imagesDrop={imagesDrop as DropzoneProps}
                setBrandStyleNotes={setBrandStyleNotes}
                removeImage={name => setImageFiles(p => p.filter(f => f.name !== name))}
                uploading={uploading} uploadError={uploadError}
                onUpload={handleUpload}
              />
            </motion.div>
          )}
          {step === 2 && uploadResult && (
            <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Step2
                result={uploadResult} editedNotes={editedNotes} setEditedNotes={setEditedNotes}
                startError={startError} onBack={() => setStep(1)} onStart={handleStart}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Step3 status={batchStatus} progress={progress} />
            </motion.div>
          )}
          {step === 4 && batchStatus && (
            <motion.div key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Step4
                status={batchStatus}
                onRetry={handleRetry}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
