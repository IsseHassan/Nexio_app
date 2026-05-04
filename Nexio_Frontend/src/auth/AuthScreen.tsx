import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Zap, Sparkles, ShoppingBag, BarChart3 } from 'lucide-react';
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

function FieldInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, autoComplete }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ComponentType<{ size: number; className?: string }>; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 700, display: 'block' }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />}
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            background: '#12121A',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '11px 14px',
            paddingLeft: Icon ? '2.25rem' : 14,
            paddingRight: isPassword ? '2.25rem' : 14,
            fontSize: 14,
            color: 'var(--text-1)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-3)' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary'; disabled?: boolean; type?: 'button' | 'submit';
}) {
  if (variant === 'primary') {
    return (
      <button type={type} onClick={onClick} disabled={disabled} className="btn-primary w-full">
        {children}
      </button>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="btn-secondary w-full">
      {children}
    </button>
  );
}

const FEATURES = [
  { icon: Sparkles, title: 'AI Product Images', desc: 'Generate stunning ad variations in seconds' },
  { icon: ShoppingBag, title: 'Marketplace Listings', desc: 'Etsy, Amazon, Shopify & more' },
  { icon: BarChart3, title: 'Smart Insights', desc: 'Discover what converts best' },
];

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1614094082869-cd4e4b2905c7?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
];

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
  const [loading, setLoading] = useState(false);

  function reset(v: View) { setView(v); setError(''); setPassword(''); setConfirm(''); setNewPass(''); setNewPassConfirm(''); }

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
    setView('reset_sent'); setLoading(false);
  }

  async function handleResetPassword() {
    if (!newPass || newPass.length < 8) return setError('Password must be at least 8 characters.');
    if (newPass !== newPassConfirm) return setError('Passwords do not match.');
    const token = devGetResetToken();
    if (!token) return setError('No pending reset token found.');
    const { error: e } = await resetPassword(token, newPass);
    if (e) { setError(e); return; }
    reset('signin');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Left panel — visual ── */}
      <div style={{ flex: '0 0 520px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '48px 48px 40px', position: 'relative', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>N</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Nexio</span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, marginBottom: 12 }}>
            Create.<br />Optimize.<br />Sell.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Turn one product photo into a full marketplace listing that sells.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo image grid: "Your Photo → AI Generated" */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            {/* Source photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border)' }}>
                <img src={DEMO_IMAGES[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Photo</span>
            </div>

            <div style={{ color: 'var(--text-3)', fontSize: 18, marginBottom: 24, fontWeight: 300 }}>→</div>

            {/* AI output grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {DEMO_IMAGES.slice(1).map((src, i) => (
                  <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.background = '#1E1E2E'; }} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Generated</span>
            </div>
          </div>
        </div>

        {/* Subtle glow */}
        <div style={{ position: 'absolute', bottom: -120, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Sign In */}
          {view === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Welcome back</h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Sign in to your account</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ label: 'Google', Icon: GoogleIcon, provider: 'google' as const }, { label: 'Apple', Icon: AppleIcon, provider: 'apple' as const }].map(({ label, Icon, provider }) => (
                  <button key={label} onClick={() => signInWithOAuth(provider)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1E1E2E')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}>
                    <Icon /> {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              <FieldInput label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} autoComplete="current-password" />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                <button onClick={() => reset('forgot')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Forgot password?</button>
              </div>

              {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}

              <Btn onClick={handleSignIn} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Btn>

              <button onClick={() => reset('magic')} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Zap size={12} color="var(--accent)" /> Use magic link instead
              </button>

              {/* Demo accounts */}
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Demo accounts</p>
                {[{ email: 'demo@nexio.com', pass: 'demo1234' }, { email: 'admin@nexio.com', pass: 'admin1234' }].map(d => (
                  <button key={d.email} onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                    style={{ display: 'block', fontSize: 11, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', marginBottom: 4, textAlign: 'left' }}>
                    {d.email} / {d.pass}
                  </button>
                ))}
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                No account?{' '}
                <button onClick={() => reset('signup')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Create one</button>
              </p>
            </div>
          )}

          {/* Sign Up */}
          {view === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => reset('signin')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4 }}>
                <ArrowLeft size={13} /> Back to sign in
              </button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Create account</h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Start generating catalog ads</p>
              </div>
              <FieldInput label="Name (optional)" value={name} onChange={setName} placeholder="Your name" icon={User} autoComplete="name" />
              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              <FieldInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={Lock} autoComplete="new-password" />
              <FieldInput label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" icon={Lock} autoComplete="new-password" />
              {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}
              <Btn onClick={handleSignUp} disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</Btn>
            </div>
          )}

          {/* Magic link */}
          {view === 'magic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => reset('signin')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={13} /> Back
              </button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Magic link</h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>We'll email you a one-click sign-in link.</p>
              </div>
              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}
              <Btn onClick={handleMagicLink}><Zap size={15} /> Send Magic Link</Btn>
            </div>
          )}

          {/* Magic sent */}
          {view === 'magic_sent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={24} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Check your inbox</h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>We sent a magic link to <strong style={{ color: 'var(--text-1)' }}>{email}</strong>.</p>
              <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dev / Mock Mode</p>
                <Btn variant="secondary" onClick={handleSimulateMagic}>Simulate email click</Btn>
              </div>
              <button onClick={() => reset('signin')} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={12} /> Back to sign in
              </button>
            </div>
          )}

          {/* Forgot */}
          {view === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => reset('signin')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={13} /> Back
              </button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Reset password</h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Enter your email and we'll send a reset link.</p>
              </div>
              <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
              {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}
              <Btn onClick={handleForgot} disabled={loading}>{loading ? 'Sending…' : 'Send Reset Email'}</Btn>
            </div>
          )}

          {/* Reset sent */}
          {view === 'reset_sent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={24} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>Check your inbox</h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>We sent a reset link to <strong style={{ color: 'var(--text-1)' }}>{email}</strong>.</p>
              <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Dev / Mock Mode</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <FieldInput label="New password" type="password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" icon={Lock} autoComplete="new-password" />
                  <FieldInput label="Confirm" type="password" value={newPassConfirm} onChange={setNewPassConfirm} placeholder="••••••••" icon={Lock} autoComplete="new-password" />
                  <Btn variant="secondary" onClick={handleResetPassword}>Set New Password</Btn>
                </div>
              </div>
              {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}
              <button onClick={() => reset('signin')} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={12} /> Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
