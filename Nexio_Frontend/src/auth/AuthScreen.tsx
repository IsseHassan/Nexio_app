import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';
import { devGetMagicToken, devGetResetToken } from './mockAuth';

type View = 'signin' | 'signup' | 'magic' | 'magic_sent' | 'forgot' | 'reset_sent';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

function Input({
  label, type = 'text', value, onChange, placeholder, icon: Icon, autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold block">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        )}
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
          style={{ paddingLeft: Icon ? '2.5rem' : undefined, paddingRight: isPassword ? '2.5rem' : undefined }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', disabled, type = 'button' }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base = 'w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700',
    ghost: 'text-zinc-400 hover:text-zinc-200',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-[11px] text-zinc-600 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

function DevPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
      <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold mb-2">Dev / Mock Mode</p>
      {children}
    </div>
  );
}

export default function AuthScreen() {
  const { signIn, signUp, signInWithOAuth, sendMagicLink, verifyMagicLink, sendPasswordReset, resetPassword } = useAuth();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function reset(v: View) {
    setView(v);
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
    setNewPass('');
    setNewPassConfirm('');
  }

  async function handleSignIn() {
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true); setError('');
    const { error: e } = await signIn(email, password);
    if (e) setError(e);
    setLoading(false);
  }

  async function handleSignUp() {
    if (!email || !password) return setError('Please fill in all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    const { error: e } = await signUp(email, password, name);
    if (e) setError(e);
    setLoading(false);
  }

  function handleMagicLink() {
    if (!email) return setError('Please enter your email.');
    sendMagicLink(email);
    setView('magic_sent');
  }

  async function handleSimulateMagic() {
    const token = devGetMagicToken();
    if (!token) return setError('No pending magic link found.');
    const { error: e } = await verifyMagicLink(token);
    if (e) setError(e);
  }

  async function handleForgot() {
    if (!email) return setError('Please enter your email.');
    setLoading(true); setError('');
    const { error: e } = await sendPasswordReset(email);
    if (e) { setError(e); setLoading(false); return; }
    setView('reset_sent');
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!newPass) return setError('Please enter a new password.');
    if (newPass.length < 8) return setError('Password must be at least 8 characters.');
    if (newPass !== newPassConfirm) return setError('Passwords do not match.');
    const token = devGetResetToken();
    if (!token) return setError('No pending reset token found.');
    const { error: e } = await resetPassword(token, newPass);
    if (e) { setError(e); return; }
    setInfo('Password updated! You can now sign in.');
    reset('signin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">A</div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            Ad<span className="text-indigo-500 underline decoration-2 underline-offset-4">Genius</span>
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {/* Sign In */}
          {view === 'signin' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
                <p className="text-sm text-zinc-500">Sign in to your account</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => signInWithOAuth('google')}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  <GoogleIcon /> Google
                </button>
                <button
                  onClick={() => signInWithOAuth('apple')}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  <AppleIcon /> Apple
                </button>
              </div>

              <Divider />

              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} autoComplete="current-password" />

              <div className="flex justify-end">
                <button onClick={() => reset('forgot')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {info && <p className="text-sm text-emerald-400">{info}</p>}

              <Btn onClick={handleSignIn} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Btn>

              <button
                onClick={() => reset('magic')}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
              >
                <Zap size={12} className="inline mr-1" />Use magic link instead
              </button>

              <p className="text-center text-xs text-zinc-600">
                No account?{' '}
                <button onClick={() => reset('signup')} className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Create one
                </button>
              </p>

              {/* Demo credentials */}
              <div className="mt-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">Demo accounts</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setEmail('demo@nexio.com'); setPassword('demo1234'); }}
                    className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                  >
                    demo@nexio.com / demo1234 <span className="text-zinc-700">· user</span>
                  </button>
                  <button
                    onClick={() => { setEmail('admin@nexio.com'); setPassword('admin1234'); }}
                    className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                  >
                    admin@nexio.com / admin1234 <span className="text-zinc-700">· admin</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sign Up */}
          {view === 'signup' && (
            <div className="space-y-4">
              <button onClick={() => reset('signin')} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
                <ArrowLeft size={13} /> Back to sign in
              </button>

              <div className="mb-2">
                <h1 className="text-xl font-semibold text-white mb-1">Create account</h1>
                <p className="text-sm text-zinc-500">Start generating catalog ads</p>
              </div>

              <Input label="Name (optional)" value={name} onChange={setName} placeholder="Your name" icon={User} autoComplete="name" />
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={Lock} autoComplete="new-password" />
              <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" icon={Lock} autoComplete="new-password" />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Btn onClick={handleSignUp} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Btn>

              <p className="text-center text-[11px] text-zinc-600">
                You'll receive a verification email before your first generation.
              </p>
            </div>
          )}

          {/* Magic Link */}
          {view === 'magic' && (
            <div className="space-y-4">
              <button onClick={() => reset('signin')} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
                <ArrowLeft size={13} /> Back to sign in
              </button>

              <div className="mb-2">
                <h1 className="text-xl font-semibold text-white mb-1">Magic link</h1>
                <p className="text-sm text-zinc-500">We'll email you a one-click sign-in link.</p>
              </div>

              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Btn onClick={handleMagicLink}><Zap size={15} /> Send Magic Link</Btn>
            </div>
          )}

          {/* Magic Sent */}
          {view === 'magic_sent' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                <Mail size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">Check your inbox</h1>
              <p className="text-sm text-zinc-500">
                We sent a magic link to <span className="text-zinc-300">{email}</span>.
                Click it to sign in instantly.
              </p>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <DevPanel>
                <Btn variant="secondary" onClick={handleSimulateMagic}>
                  Simulate email click
                </Btn>
              </DevPanel>

              <button onClick={() => reset('signin')} className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full pt-2">
                <ArrowLeft size={13} /> Back to sign in
              </button>
            </div>
          )}

          {/* Forgot Password */}
          {view === 'forgot' && (
            <div className="space-y-4">
              <button onClick={() => reset('signin')} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
                <ArrowLeft size={13} /> Back to sign in
              </button>

              <div className="mb-2">
                <h1 className="text-xl font-semibold text-white mb-1">Reset password</h1>
                <p className="text-sm text-zinc-500">Enter your email and we'll send a reset link.</p>
              </div>

              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Btn onClick={handleForgot} disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Email'}
              </Btn>
            </div>
          )}

          {/* Reset Sent */}
          {view === 'reset_sent' && (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                <Mail size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold text-white text-center">Check your inbox</h1>
              <p className="text-sm text-zinc-500 text-center">
                We sent a password reset link to <span className="text-zinc-300">{email}</span>.
              </p>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <DevPanel>
                <p className="text-xs text-zinc-500 mb-3">Simulate clicking the reset link and set a new password:</p>
                <div className="space-y-3">
                  <Input label="New password" type="password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" icon={Lock} autoComplete="new-password" />
                  <Input label="Confirm new password" type="password" value={newPassConfirm} onChange={setNewPassConfirm} placeholder="••••••••" icon={Lock} autoComplete="new-password" />
                  <Btn variant="secondary" onClick={handleResetPassword}>Set New Password</Btn>
                </div>
              </DevPanel>

              <button onClick={() => reset('signin')} className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full pt-1">
                <ArrowLeft size={13} /> Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-6 uppercase tracking-widest">
          Mock auth mode · no real emails sent
        </p>
      </div>
    </div>
  );
}
