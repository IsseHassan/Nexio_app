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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';

type ViewType = 'signin' | 'signup';

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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#7A7A7A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
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
            {show ? <EyeOff size={16} color="#ADADAD" /> : <Eye size={16} color="#ADADAD" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function PrimaryBtn({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={{ paddingVertical: 15, opacity: loading ? 0.7 : 1, backgroundColor: '#E8664A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      {loading
        ? <ActivityIndicator size="small" color="#fff" />
        : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{label}</Text>}
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState<ViewType>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchView(v: ViewType) {
    setView(v);
    setError('');
    setPassword('');
    setConfirm('');
  }

  async function handleSignIn() {
    if (!username || !password) return setError('Please fill in all fields.');
    setLoading(true); setError('');
    const { error: e } = await signIn(username.trim(), password);
    setLoading(false);
    if (e) { setError(e); return; }
    router.replace('/(tabs)');
  }

  async function handleSignUp() {
    if (!username || !email || !password) return setError('Please fill in all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    const { error: e } = await signUp(username.trim(), email.trim(), password, name.trim() || undefined);
    setLoading(false);
    if (e) { setError(e); return; }
    router.replace('/(tabs)');
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
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#E8664A', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#E8664A', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } }}>
            <Sparkles size={26} color="#fff" />
          </View>
          <Text style={{ color: '#2B2B2B', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>Nexio</Text>
          <Text style={{ color: '#7A7A7A', fontSize: 13, marginTop: 4 }}>AI Product Kit Generator</Text>
        </View>

        {view === 'signin' && (
          <View>
            <Text style={{ color: '#2B2B2B', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Welcome back</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 28 }}>Sign in with your username or email</Text>

            <Field label="Username or Email" value={username} onChange={setUsername} placeholder="yourname or you@example.com" autoCapitalize="none" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" secure />

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <PrimaryBtn label="Sign In" onPress={handleSignIn} loading={loading} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <Text style={{ color: '#ADADAD', fontSize: 13 }}>No account? </Text>
              <TouchableOpacity onPress={() => switchView('signup')}>
                <Text style={{ color: '#E8664A', fontSize: 13, fontWeight: '600' }}>Create one</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {view === 'signup' && (
          <View>
            <TouchableOpacity onPress={() => switchView('signin')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 6 }}>
              <ArrowLeft size={14} color="#ADADAD" />
              <Text style={{ color: '#7A7A7A', fontSize: 12 }}>Back to sign in</Text>
            </TouchableOpacity>

            <Text style={{ color: '#2B2B2B', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Create account</Text>
            <Text style={{ color: '#7A7A7A', fontSize: 14, marginBottom: 28 }}>Start generating product kits with AI</Text>

            <Field label="Username" value={username} onChange={setUsername} placeholder="yourname" autoCapitalize="none" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoCapitalize="none" />
            <Field label="Name (optional)" value={name} onChange={setName} placeholder="Your name" autoCapitalize="words" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" secure />
            <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="••••••••" secure />

            {!!error && <Text style={{ color: '#D46A5A', fontSize: 14, marginBottom: 16 }}>{error}</Text>}

            <PrimaryBtn label="Create Account" onPress={handleSignUp} loading={loading} />

            <Text style={{ color: '#ADADAD', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
              Account stored securely. No email verification required.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
