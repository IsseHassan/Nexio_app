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
          placeholderTextColor="#52525b"
          secureTextEntry={secure && !show}
          keyboardType={keyboard ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          className="bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
          style={{ paddingHorizontal: 16, paddingVertical: 14, paddingRight: secure ? 48 : 16 }}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            {show
              ? <EyeOff size={16} color="#71717a" />
              : <Eye size={16} color="#71717a" />}
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
      className="bg-indigo-600 rounded-xl items-center justify-center flex-row"
      style={{ paddingVertical: 15, gap: 8, opacity: loading ? 0.7 : 1 }}
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
      className="bg-zinc-800 border border-zinc-700 rounded-xl items-center justify-center"
      style={{ paddingVertical: 14 }}
    >
      <Text className="text-zinc-200 font-medium text-sm">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── OAuth buttons ───────────────────────────────────────────────────────────

function OAuthBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl items-center justify-center"
      style={{ paddingVertical: 13 }}
    >
      <Text className="text-zinc-200 font-medium text-sm">{label}</Text>
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
      <View className="flex-1 bg-zinc-800" style={{ height: 1 }} />
      <Text className="text-zinc-600 text-xs uppercase tracking-widest">or</Text>
      <View className="flex-1 bg-zinc-800" style={{ height: 1 }} />
    </View>
  );
}

// ─── Back link ───────────────────────────────────────────────────────────────

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center mb-6" style={{ gap: 6 }}>
      <ArrowLeft size={14} color="#71717a" />
      <Text className="text-zinc-500 text-xs">Back to sign in</Text>
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
      style={{ flex: 1, backgroundColor: '#09090b' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center mb-3" style={{ shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 16 }}>
            <Sparkles size={22} color="#fff" />
          </View>
          <Text className="text-white text-2xl font-bold tracking-tight">
            Ad<Text className="text-indigo-400">Genius</Text>
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">AI Product Catalog Generator</Text>
        </View>

        {/* ── Sign In ────────────────────────────────────────────── */}
        {view === 'signin' && (
          <View>
            <Text className="text-white text-xl font-semibold mb-1">Welcome back</Text>
            <Text className="text-zinc-500 text-sm mb-6">Sign in to your account</Text>

            <View className="flex-row mb-4" style={{ gap: 10 }}>
              <OAuthBtn label="🇬 Google" onPress={() => signInWithOAuth('google')} />
              <OAuthBtn label=" Apple" onPress={() => signInWithOAuth('apple')} />
            </View>

            <Divider />

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" secure />

            <TouchableOpacity onPress={() => go('forgot')} className="items-end mb-5 -mt-1">
              <Text className="text-indigo-400 text-xs">Forgot password?</Text>
            </TouchableOpacity>

            {!!error && <Text className="text-red-400 text-sm mb-4">{error}</Text>}
            {!!info && <Text className="text-emerald-400 text-sm mb-4">{info}</Text>}

            <PrimaryBtn label="Sign In" onPress={handleSignIn} loading={loading} />

            <TouchableOpacity onPress={() => go('magic')} className="items-center mt-4">
              <Text className="text-zinc-500 text-xs">
                <Text className="text-indigo-400">⚡ Use magic link</Text> instead
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-5">
              <Text className="text-zinc-600 text-xs">No account? </Text>
              <TouchableOpacity onPress={() => go('signup')}>
                <Text className="text-indigo-400 text-xs font-medium">Create one</Text>
              </TouchableOpacity>
            </View>

            {/* Demo credentials */}
            <View className="mt-6 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
              <Text className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">Demo accounts</Text>
              <TouchableOpacity
                onPress={() => { setEmail('demo@nexio.com'); setPassword('demo1234'); }}
                className="mb-2"
              >
                <Text className="text-zinc-500 text-xs font-mono">demo@nexio.com / demo1234
                  <Text className="text-zinc-700"> · user</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEmail('admin@nexio.com'); setPassword('admin1234'); }}
              >
                <Text className="text-zinc-500 text-xs font-mono">admin@nexio.com / admin1234
                  <Text className="text-zinc-700"> · admin</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Sign Up ────────────────────────────────────────────── */}
        {view === 'signup' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text className="text-white text-xl font-semibold mb-1">Create account</Text>
            <Text className="text-zinc-500 text-sm mb-6">Start generating catalog ads</Text>

            <Field label="Name (optional)" value={name} onChange={setName} placeholder="Your name" autoCapitalize="words" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" secure />
            <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="••••••••" secure />

            {!!error && <Text className="text-red-400 text-sm mb-4">{error}</Text>}

            <PrimaryBtn label="Create Account" onPress={handleSignUp} loading={loading} />

            <Text className="text-zinc-600 text-xs text-center mt-4">
              You'll verify your email before your first generation.
            </Text>
          </View>
        )}

        {/* ── Magic Link ─────────────────────────────────────────── */}
        {view === 'magic' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text className="text-white text-xl font-semibold mb-1">Magic link</Text>
            <Text className="text-zinc-500 text-sm mb-6">We'll send you a one-tap sign-in link.</Text>

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />

            {!!error && <Text className="text-red-400 text-sm mb-4">{error}</Text>}

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
            <View className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mb-5">
              <Mail size={28} color="#818cf8" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">Check your inbox</Text>
            <Text className="text-zinc-400 text-sm text-center mb-1">
              We sent a magic link to
            </Text>
            <Text className="text-zinc-200 text-sm font-medium mb-8">{email}</Text>

            {!!error && <Text className="text-red-400 text-sm mb-4">{error}</Text>}

            <View className="w-full">
              <DevPanel>
                <SecondaryBtn label="Simulate email click" onPress={handleSimulateMagic} />
              </DevPanel>
            </View>

            <TouchableOpacity onPress={() => go('signin')} className="flex-row items-center mt-6" style={{ gap: 6 }}>
              <ArrowLeft size={13} color="#71717a" />
              <Text className="text-zinc-500 text-xs">Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Forgot Password ────────────────────────────────────── */}
        {view === 'forgot' && (
          <View>
            <BackLink onPress={() => go('signin')} />
            <Text className="text-white text-xl font-semibold mb-1">Reset password</Text>
            <Text className="text-zinc-500 text-sm mb-6">Enter your email and we'll send a reset link.</Text>

            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />

            {!!error && <Text className="text-red-400 text-sm mb-4">{error}</Text>}

            <PrimaryBtn label="Send Reset Email" onPress={handleForgot} loading={loading} />
          </View>
        )}

        {/* ── Reset Sent ─────────────────────────────────────────── */}
        {view === 'reset_sent' && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mb-5">
              <Mail size={28} color="#818cf8" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">Check your inbox</Text>
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
              <ArrowLeft size={13} color="#71717a" />
              <Text className="text-zinc-500 text-xs">Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mock mode footer */}
        <Text className="text-zinc-700 text-xs text-center uppercase tracking-widest mt-8">
          Mock auth · no real emails sent
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
