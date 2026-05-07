import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { devGetMagicToken, devGetResetToken } from '../../src/auth/mockAuth';

type ViewType = 'signin' | 'signup' | 'magic' | 'magic_sent' | 'forgot' | 'reset_sent';

// ─── Reusable input ──────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  keyboard,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboard?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
        {label}
      </Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#ADADAD"
          secureTextEntry={secure && !show}
          keyboardType={keyboard ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          style={{ paddingHorizontal: 16, paddingVertical: 14, paddingRight: secure ? 48 : 16, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, color: '#2B2B2B', fontSize: 14 }}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            {show
              ? <EyeOff size={16} color="#ADADAD" />
              : <Eye size={16} color="#ADADAD" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Primary button ──────────────────────────────────────────────────────────

function PrimaryBtn({
  label,
  onPress,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={{ paddingVertical: 15, gap: 8, opacity: loading ? 0.7 : 1, backgroundColor: '#E8664A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
    >
      {loading
        ? <ActivityIndicator size="small" color="#fff" />
        : <>
            {icon}
            <Text className="text-white font-semibold text-sm">{label}</Text>
          </>}
    </TouchableOpacity>
  );
}

// ─── Secondary button ────────────────────────────────────────────────────────

function SecondaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ paddingVertical: 14, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#2B2B2B', fontWeight: '500', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── OAuth buttons ───────────────────────────────────────────────────────────

function OAuthBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ paddingVertical: 13, flex: 1, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#2B2B2B', fontWeight: '500', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Dev panel ───────────────────────────────────────────────────────────────

function DevPanel({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="rounded-xl mt-4"
      style={{ borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.05)', padding: 14 }}
    >
      <Text className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(245,158,11,0.7)' }}>
        Dev / Mock Mode
      </Text>
      {children}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <View className="flex-row items-center my-4" style={{ gap: 10 }}>
      <View style={{ flex: 1, backgroundColor: '#CFCBC7', height: 1 }} />
      <Text style={{ color: '#ADADAD', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>or</Text>
      <View style={{ flex: 1, backgroundColor: '#CFCBC7', height: 1 }} />
    </View>
  );
}

// ─── Back link ───────────────────────────────────────────────────────────────

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center mb-6" style={{ gap: 6 }}>
      <ArrowLeft size={14} color="#ADADAD" />
      <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Back to sign in</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signIn, signUp, signInWithOAuth, sendMagicLink, verifyMagicLink, sendPasswordReset, resetPassword } = useAuth();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState<ViewType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function go(v: ViewType) {
    setView(v);
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
    setNewPass('');
    setNewPassConfirm('');
  }

  function handleSignIn() {
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true); setError('');
    const { error: e } = signIn(email.trim(), password);
    if (e) setError(e);
    setLoading(false);
  }

  function handleSignUp() {
    if (!email || !password) return setError('Please fill in all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    const { error: e } = signUp(email.trim(), password, name.trim() || undefined);
    if (e) setError(e);
    setLoading(false);
  }

  function handleMagicLink() {
    if (!email) return setError('Please enter your email.');
    sendMagicLink(email.trim());
    go('magic_sent');
  }

  function handleSimulateMagic() {
    const token = devGetMagicToken();
    if (!token) return setError('No pending magic token found.');
    const { error: e } = verifyMagicLink(token);
    if (e) setError(e);
  }

  function handleForgot() {
    if (!email) return setError('Please enter your email.');
    setLoading(true); setError('');
    const { error: e } = sendPasswordReset(email.trim());
    setLoading(false);
    if (e) return setError(e);
    go('reset_sent');
  }

  function handleResetPassword() {
    if (!newPass) return setError('Please enter a new password.');
    if (newPass.length < 8) return setError('Password must be at least 8 characters.');
    if (newPass !== newPassConfirm) return setError('Passwords do not match.');
    const token = devGetResetToken();
    if (!token) return setError('No pending reset token found.');
    const { error: e } = resetPassword(token, newPass);
    if (e) return setError(e);
    setInfo('Password updated! You can now sign in.');
    go('signin');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#EDE4DC' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#E8664A', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#E8664A', shadowOpacity: 0.4, shadowRadius: 16 }}>
            <Sparkles size={22} color="#fff" />
          </View>
          <Text style={{ color: '#2B2B2B', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>
            Ad<Text style={{ color: '#8A9A6E' }}>Genius</Text>
          </Text>
          <Text style={{ color: '#7A7A7A', fontSize: 12, marginTop: 4 }}>AI Product Catalog Generator</Text>
        </View>

        {/* ── Sign In ────────────────────────────────────────────── */}
        {view === 'signin' && (
          <View>
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 4 }}>Welcome back</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 24 }}>Sign in to your account</Text>

            <View className="flex-row mb-4" style={{ gap: 10 }}>
              <OAuthBtn label="🇬 Google" onPress={() => signInWithOAuth('google')} />
              <OAuthBtn label=" Apple" onPress={() => signInWithOAuth('apple')} />
            </View>

            <Divider />

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" secure />

            <TouchableOpacity onPress={() => go('forgot')} className="items-end mb-5 -mt-1">
              <Text style={{ color: '#E8664A', fontSize: 12 }}>Forgot password?</Text>
            </TouchableOpacity>

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}
            {!!info && <Text style={{ color: '#7E8F5A', fontSize: 14, marginBottom: 16 }}>{info}</Text>}

            <PrimaryBtn label="Sign In" onPress={handleSignIn} loading={loading} />

            <TouchableOpacity onPress={() => go('magic')} className="items-center mt-4">
              <Text style={{ color: '#7A7A7A', fontSize: 12 }}>
                <Text className="text-indigo-400">⚡ Use magic link</Text> instead
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-5">
              <Text style={{ color: '#ADADAD', fontSize: 12 }}>No account? </Text>
              <TouchableOpacity onPress={() => go('signup')}>
                <Text className="text-indigo-400 text-xs font-medium">Create one</Text>
              </TouchableOpacity>
            </View>

            {/* Demo credentials */}
            <View style={{ marginTop: 24, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, padding: 16 }}>
              <Text style={{ color: '#ADADAD', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Demo accounts</Text>
              <TouchableOpacity
                onPress={() => { setEmail('demo@nexio.com'); setPassword('demo1234'); }}
                style={{ marginBottom: 8 }}
              >
                <Text style={{ color: '#7A7A7A', fontSize: 12, fontFamily: 'monospace' }}>demo@nexio.com / demo1234
                  <Text style={{ color: '#ADADAD' }}> · user</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEmail('admin@nexio.com'); setPassword('admin1234'); }}
              >
                <Text style={{ color: '#7A7A7A', fontSize: 12, fontFamily: 'monospace' }}>admin@nexio.com / admin1234
                  <Text style={{ color: '#ADADAD' }}> · admin</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Sign Up ────────────────────────────────────────────── */}
        {view === 'signup' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 4 }}>Create account</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 24 }}>Start generating catalog ads</Text>

            <Field label="Name (optional)" value={name} onChange={setName} placeholder="Your name" autoCapitalize="words" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" secure />
            <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="••••••••" secure />

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <PrimaryBtn label="Create Account" onPress={handleSignUp} loading={loading} />

            <Text style={{ color: '#ADADAD', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
              You'll verify your email before your first generation.
            </Text>
          </View>
        )}

        {/* ── Magic Link ─────────────────────────────────────────── */}
        {view === 'magic' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 4 }}>Magic link</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 24 }}>We'll send you a one-tap sign-in link.</Text>

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <PrimaryBtn
              label="Send Magic Link"
              onPress={handleMagicLink}
              icon={<Zap size={15} color="#fff" />}
            />
          </View>
        )}

        {/* ── Magic Sent ─────────────────────────────────────────── */}
        {view === 'magic_sent' && (
          <View className="items-center">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(215,135,106,0.1)', borderWidth: 1, borderColor: 'rgba(215,135,106,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Mail size={28} color="#E8664A" />
            </View>
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Check your inbox</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
              We sent a magic link to
            </Text>
            <Text style={{ color: '#2B2B2B', fontSize: 14, fontWeight: '500', marginBottom: 32 }}>{email}</Text>

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <View className="w-full">
              <DevPanel>
                <SecondaryBtn label="Simulate email click" onPress={handleSimulateMagic} />
              </DevPanel>
            </View>

            <TouchableOpacity onPress={() => go('signin')} className="flex-row items-center mt-6" style={{ gap: 6 }}>
              <ArrowLeft size={13} color="#ADADAD" />
              <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Forgot Password ────────────────────────────────────── */}
        {view === 'forgot' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 4 }}>Reset password</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 24 }}>Enter your email and we'll send a reset link.</Text>

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <PrimaryBtn label="Send Reset Email" onPress={handleForgot} loading={loading} />
          </View>
        )}

        {/* ── Reset Sent ─────────────────────────────────────────── */}
        {view === 'reset_sent' && (
          <View className="items-center">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(215,135,106,0.1)', borderWidth: 1, borderColor: 'rgba(215,135,106,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Mail size={28} color="#E8664A" />
            </View>
            <Text style={{ color: '#2B2B2B', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Check your inbox</Text>
            <Text className="text-zinc-400 text-sm text-center mb-8">
              We sent a password reset link to{'\n'}
              <Text className="text-zinc-200 font-medium">{email}</Text>
            </Text>

            {!!error && <Text className="text-red-400 text-sm mb-4 text-center">{error}</Text>}

            <View className="w-full">
              <DevPanel>
                <Text className="text-zinc-400 text-xs mb-4">Simulate clicking the reset link and set a new password:</Text>
                <Field label="New password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" secure />
                <Field label="Confirm new password" value={newPassConfirm} onChange={setNewPassConfirm} placeholder="••••••••" secure />
                <SecondaryBtn label="Set New Password" onPress={handleResetPassword} />
              </DevPanel>
            </View>

            <TouchableOpacity onPress={() => go('signin')} className="flex-row items-center mt-6" style={{ gap: 6 }}>
              <ArrowLeft size={13} color="#ADADAD" />
              <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mock mode footer */}
        <Text style={{ color: '#CFCBC7', fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, marginTop: 32 }}>
          Mock auth · no real emails sent
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
