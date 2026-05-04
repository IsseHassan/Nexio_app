import React, { useEffect, useState } from 'react';
import { Package, MessageCircle, Share2, ChevronRight } from 'lucide-react';
import { ChatWidget } from './ChatWidget';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface KitSummary {
  id: string;
  productName: string;
  category: string;
  thumbnailUrl: string | null;
  shortDescription: string;
}

interface StoreData {
  store: { slug: string; displayName: string; tagline: string; contactWhatsapp: string; contactEmail: string };
  kits: KitSummary[];
}

function shareWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function StoreFront({ slug }: { slug: string }) {
  const [data, setData] = useState<StoreData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/store/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Could not load store.'));
  }, [slug]);

  if (error) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 text-sm">
      {error === 'Store not found' ? 'This store does not exist.' : error}
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { store, kits } = data;
  const storeUrl = window.location.href;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
              {store.displayName[0]?.toUpperCase() ?? 'S'}
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{store.displayName}</p>
              {store.tagline && <p className="text-zinc-500 text-xs">{store.tagline}</p>}
            </div>
          </div>
          <button
            onClick={() => shareWhatsApp(`Check out ${store.displayName}'s store: ${storeUrl}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600"
          >
            <Share2 size={13} /> Share Store
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{store.displayName}</h1>
          {store.tagline && <p className="text-zinc-400 text-base">{store.tagline}</p>}
          <p className="text-zinc-600 text-sm mt-1">{kits.length} product{kits.length !== 1 ? 's' : ''}</p>
        </div>

        {kits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
            <Package size={40} />
            <p className="text-lg font-medium">No products yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {kits.map(kit => (
              <a
                key={kit.id}
                href={`/store/${slug}/${kit.id}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-800 overflow-hidden relative">
                  {kit.thumbnailUrl ? (
                    <img
                      src={kit.thumbnailUrl}
                      alt={kit.productName}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-zinc-700" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1">{kit.productName}</p>
                  <p className="text-zinc-600 text-xs mb-3 line-clamp-2">{kit.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{kit.category}</span>
                    <span className="text-indigo-400 text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      View <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        {(store.contactWhatsapp || store.contactEmail) && (
          <div className="mt-14 border border-zinc-800 rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-white font-bold text-lg">Interested in something?</p>
              <p className="text-zinc-500 text-sm mt-1">Get in touch with the seller directly.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {store.contactWhatsapp && (
                <a
                  href={`https://wa.me/${store.contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your store at ${storeUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe59] text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
              {store.contactEmail && (
                <a
                  href={`mailto:${store.contactEmail}?subject=${encodeURIComponent(`Inquiry from ${store.displayName} store`)}`}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-colors border border-zinc-700"
                >
                  Email
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      <ChatWidget storeSlug={slug} apiUrl={API} />
    </div>
  );
}
