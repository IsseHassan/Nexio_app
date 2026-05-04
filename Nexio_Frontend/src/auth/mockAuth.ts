// Mock auth — localStorage-backed, no real backend.
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
  expiresAt: number;
}

const K = {
  users: 'nexio_users',
  session: 'nexio_session',
  verify: 'nexio_verify_tokens',
  reset: 'nexio_reset_tokens',
  magic: 'nexio_magic_tokens',
  lastMagic: 'nexio_dev_last_magic',
  lastReset: 'nexio_dev_last_reset',
  lastVerify: 'nexio_dev_last_verify',
};

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def; }
  catch { return def; }
}

function save(key: string, v: unknown): void {
  localStorage.setItem(key, JSON.stringify(v));
}

// Seed demo accounts on first load
(function seed() {
  if (load<unknown[]>(K.users, []).length) return;
  save(K.users, [
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
  ]);
})();

function persist(user: MockUser): Session {
  const s: Session = { user, token: uid(), expiresAt: Date.now() + 7 * 86400_000 };
  save(K.session, s);
  return s;
}

export function getSession(): Session | null {
  const s = load<Session | null>(K.session, null);
  if (!s || s.expiresAt < Date.now()) { localStorage.removeItem(K.session); return null; }
  return s;
}

export function refreshSession(): Session | null {
  const s = getSession();
  if (!s) return null;
  const found = load<StoredUser[]>(K.users, []).find(u => u.id === s.user.id);
  if (!found) return null;
  const { passwordHash: _pw, ...user } = found;
  return persist(user);
}

export function signUp(
  email: string,
  password: string,
  name?: string,
): { session?: Session; error?: string } {
  const users = load<StoredUser[]>(K.users, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
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
  save(K.users, [...users, newUser]);

  // Dev: store verify token for simulation
  const token = uid();
  save(K.verify, { ...load<Record<string, string>>(K.verify, {}), [token]: newUser.id });
  save(K.lastVerify, token);

  const { passwordHash: _pw, ...user } = newUser;
  return { session: persist(user) };
}

export function signIn(
  email: string,
  password: string,
): { session?: Session; error?: string } {
  const found = load<StoredUser[]>(K.users, []).find(
    u => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found) return { error: 'No account found with this email.' };
  if (found.passwordHash !== hash(password)) return { error: 'Incorrect password.' };
  const { passwordHash: _pw, ...user } = found;
  return { session: persist(user) };
}

export function signInWithOAuth(provider: 'google' | 'apple'): Session {
  const email = `mock.${provider}@oauth.demo`;
  const users = load<StoredUser[]>(K.users, []);
  let found = users.find(u => u.email === email);
  if (!found) {
    found = {
      id: `${provider}-${uid()}`, email,
      name: provider === 'google' ? 'Google User' : 'Apple User',
      role: 'user', emailVerified: true, provider, passwordHash: '',
    };
    save(K.users, [...users, found]);
  }
  const { passwordHash: _pw, ...user } = found;
  return persist(user);
}

export function sendMagicLink(email: string): void {
  const token = uid();
  save(K.magic, { ...load<Record<string, string>>(K.magic, {}), [token]: email.toLowerCase() });
  save(K.lastMagic, token);
}

export function devGetMagicToken(): string | null {
  return localStorage.getItem(K.lastMagic);
}

export function verifyMagicLink(
  token: string,
): { session?: Session; error?: string } {
  const tokens = load<Record<string, string>>(K.magic, {});
  const email = tokens[token];
  if (!email) return { error: 'Invalid or expired link.' };

  const updated = { ...tokens };
  delete updated[token];
  save(K.magic, updated);
  localStorage.removeItem(K.lastMagic);

  const users = load<StoredUser[]>(K.users, []);
  let found = users.find(u => u.email === email);
  if (!found) {
    found = {
      id: 'u-' + uid(), email, name: email.split('@')[0],
      role: 'user', emailVerified: true, provider: 'magic_link', passwordHash: '',
    };
    save(K.users, [...users, found]);
  } else if (!found.emailVerified) {
    save(K.users, users.map(u => u.id === found!.id ? { ...u, emailVerified: true } : u));
    found = { ...found, emailVerified: true };
  }
  const { passwordHash: _pw, ...user } = found;
  return { session: persist(user) };
}

export function sendPasswordReset(email: string): { error?: string } {
  const found = load<StoredUser[]>(K.users, []).find(
    u => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found) return { error: 'No account found with this email.' };
  const token = uid();
  save(K.reset, { ...load<Record<string, string>>(K.reset, {}), [token]: found.id });
  save(K.lastReset, token);
  return {};
}

export function devGetResetToken(): string | null {
  return localStorage.getItem(K.lastReset);
}

export function resetPassword(token: string, newPass: string): { error?: string } {
  const tokens = load<Record<string, string>>(K.reset, {});
  const userId = tokens[token];
  if (!userId) return { error: 'Invalid or expired reset link.' };
  const updated = { ...tokens };
  delete updated[token];
  save(K.reset, updated);
  localStorage.removeItem(K.lastReset);
  save(K.users, load<StoredUser[]>(K.users, []).map(
    u => u.id === userId ? { ...u, passwordHash: hash(newPass) } : u,
  ));
  return {};
}

export function verifyEmail(userId: string): void {
  save(K.users, load<StoredUser[]>(K.users, []).map(
    u => u.id === userId ? { ...u, emailVerified: true } : u,
  ));
  const s = getSession();
  if (s?.user.id === userId) { s.user.emailVerified = true; save(K.session, s); }
}

export function signOut(): void {
  localStorage.removeItem(K.session);
}
