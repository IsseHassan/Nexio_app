import React, { useState } from 'react';
import { Mail, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function VerifyEmailScreen() {
  const { user, verifyEmail, sendMagicLink, signOut } = useAuth();
  const [resent, setResent] = useState(false);

  function handleResend() {
    if (user?.email) sendMagicLink(user.email);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-indigo-400" />
          </div>

          <h1 className="text-2xl font-semibold text-white mb-2">Verify your email</h1>
          <p className="text-sm text-zinc-400 mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-medium text-zinc-200 mb-6">{user?.email}</p>

          <p className="text-xs text-zinc-600 mb-8">
            Click the link in the email to activate your account. You must verify before generating ads.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resent}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={resent ? 'animate-spin' : ''} />
              {resent ? 'Email sent!' : 'Resend verification email'}
            </button>

            {/* Dev simulation */}
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold mb-2">Dev / Mock Mode</p>
              <button
                onClick={() => verifyEmail()}
                className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Simulate email click → verify now
              </button>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-6 uppercase tracking-widest">
          Mock auth mode · no real emails sent
        </p>
      </div>
    </div>
  );
}
