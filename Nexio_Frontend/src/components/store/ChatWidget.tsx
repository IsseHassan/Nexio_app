import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; text: string }

interface ChatWidgetProps {
  storeSlug: string;
  kitId?: string;
  apiUrl: string;
}

export function ChatWidget({ storeSlug, kitId, apiUrl }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hi! Ask me anything about this product.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/store/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, kitId, userMessage: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response || data.error || 'Sorry, try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="w-80 h-[420px] mb-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
            <div>
              <p className="text-white text-sm font-semibold">Ask about this product</p>
              <p className="text-zinc-500 text-xs mt-0.5">AI Sales Assistant · Beta</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={17} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-500 px-3 py-2 rounded-2xl rounded-bl-sm text-[13px]">
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-zinc-800 flex gap-2 bg-zinc-900/60">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask a question…"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
