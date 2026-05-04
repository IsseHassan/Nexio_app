import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, Share2, Copy, ChevronLeft, ChevronRight as ChevronRightIcon, Package } from 'lucide-react';
import { ChatWidget } from './ChatWidget';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface KitDetail {
  id: string; productName: string; category: string;
  thumbnailUrl: string | null; imageUrls: string[];
  listing: { title: string; shortDescription: string; longDescription: string; bullets: string[]; keywords: string[] };
}
interface StoreInfo { slug: string; displayName: string; contactWhatsapp: string; contactEmail: string }
interface ProductData { kit: KitDetail; store: StoreInfo | null }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function ProductPage({ slug, kitId }: { slug: string; kitId: string }) {
  const [data, setData] = useState<ProductData | null>(null);
  const [error, setError] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/store/${slug}/kit/${kitId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Could not load product.'));
  }, [slug, kitId]);

  if (error) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center flex-col gap-4 text-zinc-500">
      <Package size={36} />
      <p>{error === 'Product not found' ? 'This product is no longer available.' : error}</p>
      <a href={`/store/${slug}`} className="text-indigo-400 hover:underline text-sm">← Back to store</a>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { kit, store } = data;
  const allImages = kit.imageUrls.length > 0 ? kit.imageUrls : (kit.thumbnailUrl ? [kit.thumbnailUrl] : []);
  const currentImage = allImages[imgIndex];
  const productUrl = window.location.href;

  function buildContactUrl(message: string) {
    if (store?.contactWhatsapp) {
      const num = store.contactWhatsapp.replace(/\D/g, '');
      return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
    }
    if (store?.contactEmail) {
      return `mailto:${store.contactEmail}?subject=${encodeURIComponent(`Inquiry: ${kit.productName}`)}`;
    }
    return null;
  }

  const contactMsg = `Hi! I'm interested in "${kit.productName}". ${productUrl}`;
  const contactUrl = buildContactUrl(contactMsg);

  function handleCopyLink() {
    copyToClipboard(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <a href={`/store/${slug}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> {store?.displayName ?? 'Store'}
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Image section */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 relative">
              {currentImage ? (
                <img src={currentImage} alt={kit.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-zinc-700" />
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <button onClick={() => setImgIndex(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center text-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIndex(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center text-white transition-colors">
                    <ChevronRightIcon size={18} />
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((url, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${i === imgIndex ? 'border-indigo-500' : 'border-zinc-800 hover:border-zinc-600'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-semibold">{kit.category}</span>
              <h1 className="text-2xl font-bold text-white mt-3 leading-tight">{kit.listing.title || kit.productName}</h1>
              {kit.listing.shortDescription && (
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{kit.listing.shortDescription}</p>
              )}
              <p className="text-zinc-500 text-sm mt-3 font-medium">Contact for price</p>
            </div>

            {/* Primary CTA */}
            {contactUrl ? (
              <a href={contactUrl} target={store?.contactWhatsapp ? '_blank' : '_self'} rel="noreferrer"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/20">
                <MessageCircle size={18} /> Contact to Buy
              </a>
            ) : (
              <div className="w-full py-4 bg-zinc-800 text-zinc-500 font-bold text-center rounded-2xl text-sm">
                Contact seller to purchase
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this product: ${productUrl}`)}`, '_blank')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={15} /> Share
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                  copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                }`}
              >
                <Copy size={15} /> {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Bullets */}
            {kit.listing.bullets.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Highlights</p>
                <ul className="space-y-2">
                  {kit.listing.bullets.slice(0, 5).map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Long description — collapsible */}
            {kit.listing.longDescription && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-3">Description</p>
                <p className={`text-sm text-zinc-300 leading-relaxed ${showFullDesc ? '' : 'line-clamp-4'}`}>
                  {kit.listing.longDescription}
                </p>
                {kit.listing.longDescription.length > 300 && (
                  <button onClick={() => setShowFullDesc(v => !v)}
                    className="text-indigo-400 text-xs font-semibold mt-2 hover:text-indigo-300 transition-colors">
                    {showFullDesc ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Keywords */}
            {kit.listing.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {kit.listing.keywords.slice(0, 10).map(kw => (
                  <span key={kw} className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatWidget storeSlug={slug} kitId={kitId} apiUrl={API} />
    </div>
  );
}
