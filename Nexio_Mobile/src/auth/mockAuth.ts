// Mock auth — in-memory, resets on app restart.
// Swap exported functions for @supabase/supabase-js calls when ready.

export type UserRole = 'user' | 'admin' | 'service';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  provider: 'email' | 'google' | 'apple' | 'magic_link';
}

interface StoredUser extends MockUser {
  passwordHash: string;
}

export interface Session {
  user: MockUser;
  token: string;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// In-memory storage — seeded demo accounts are always available
let _users: StoredUser[] = [
  {
    id: 'demo-001', email: 'demo@nexio.com', name: 'Demo User',
    role: 'user', emailVerified: true, provider: 'email',
    passwordHash: hash('demo1234'),
  },
  {
    id: 'admin-001', email: 'admin@nexio.com', name: 'Admin',
    role: 'admin', emailVerified: true, provider: 'email',
    passwordHash: hash('admin1234'),
  },
];

let _session: Session | null = null;
let _devMagicTokens: Record<string, string> = {};
let _devResetTokens: Record<string, string> = {};
let _lastMagicToken: string | null = null;
let _lastResetToken: string | null = null;

function persist(user: MockUser): Session {
  _session = { user, token: uid() };
  return _session;
}

export function getSession(): Session | null {
  return _session;
}

export function signUp(
  email: string,
  password: string,
  name?: string,
): { session?: Session; error?: string } {
  if (_users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { error: 'An account with this email already exists.' };

  const newUser: StoredUser = {
    id: 'u-' + uid(),
    email: email.toLowerCase(),
    name: name?.trim() || email.split('@')[0],
    role: 'user',
    emailVerified: false,
    provider: 'email',
    passwordHash: hash(password),
  };
  _users = [..._users, newUser];
  const { passwordHash: _pw, ...user } = newUser;
  return { session: persist(user) };
}

export function signIn(
  email: string,
  password: string,
): { session?: Session; error?: string } {
  const found = _users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) return { error: 'No account found with this email.' };
  if (found.passwordHash !== hash(password)) return { error: 'Incorrect password.' };
  const { passwordHash: _pw, ...user } = found;
  return { session: persist(user) };
}

export function signInWithOAuth(provider: 'google' | 'apple'): Session {
  const email = `mock.${provider}@oauth.demo`;
  let found = _users.find(u => u.email === email);
  if (!found) {
    found = {
      id: `${provider}-${uid()}`, email,
      name: provider === 'google' ? 'Google User' : 'Apple User',
      role: 'user', emailVerified: true, provider, passwordHash: '',
    };
    _users = [..._users, found];
  }
  const { passwordHash: _pw, ...user } = found;
  return persist(user);
}

export function sendMagicLink(email: string): void {
  const token = uid();
  _devMagicTokens[token] = email.toLowerCase();
  _lastMagicToken = token;
}

export function devGetMagicToken(): string | null {
  return _lastMagicToken;
}

export function verifyMagicLink(
  token: string,
): { session?: Session; error?: string } {
  const email = _devMagicTokens[token];
  if (!email) return { error: 'Invalid or expired link.' };
  delete _devMagicTokens[token];
  _lastMagicToken = null;

  let found = _users.find(u => u.email === email);
  if (!found) {
    found = {
      id: 'u-' + uid(), email, name: email.split('@')[0],
      role: 'user', emailVerified: true, provider: 'magic_link', passwordHash: '',
    };
    _users = [..._users, found];
  } else if (!found.emailVerified) {
    _users = _users.map(u => u.id === found!.id ? { ...u, emailVerified: true } : u);
    found = { ...found, emailVerified: true };
  }
  const { passwordHash: _pw, ...user } = found;
  return { session: persist(user) };
}

export function sendPasswordReset(email: string): { error?: string } {
  const found = _users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) return { error: 'No account found with this email.' };
  const token = uid();
  _devResetTokens[token] = found.id;
  _lastResetToken = token;
  return {};
}

export function devGetResetToken(): string | null {
  return _lastResetToken;
}

export function resetPassword(token: string, newPass: string): { error?: string } {
  const userId = _devResetTokens[token];
  if (!userId) return { error: 'Invalid or expired reset link.' };
  delete _devResetTokens[token];
  _lastResetToken = null;
  _users = _users.map(u => u.id === userId ? { ...u, passwordHash: hash(newPass) } : u);
  return {};
}

export function verifyEmail(userId: string): void {
  _users = _users.map(u => u.id === userId ? { ...u, emailVerified: true } : u);
  if (_session?.user.id === userId) {
    _session = { ..._session, user: { ..._session.user, emailVerified: true } };
  }
}

export function signOut(): void {
  _session = null;
}
