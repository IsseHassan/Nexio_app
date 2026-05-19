import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { getServerUrl } from '../services/settingsService';

const TOKEN_FILE = `${FileSystem.documentDirectory}nexio_token.txt`;

export interface AppUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthCtx {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error?: string }>;
  signUp: (username: string, email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const SKIP_NGROK = { 'ngrok-skip-browser-warning': '1' };

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Cannot reach server — check your connection or server URL.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function apiPost(path: string, body: object): Promise<any> {
  const res = await fetchWithTimeout(`${getServerUrl()}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...SKIP_NGROK },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

async function apiGet(path: string, token: string): Promise<any> {
  const res = await fetchWithTimeout(`${getServerUrl()}/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...SKIP_NGROK },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FileSystem.readAsStringAsync(TOKEN_FILE).then(async (storedToken) => {
      if (!storedToken) { setLoading(false); return; }
      try {
        const { user: u } = await apiGet('/auth/me', storedToken);
        setToken(storedToken);
        setUser(u);
      } catch {
        await FileSystem.deleteAsync(TOKEN_FILE, { idempotent: true });
      } finally {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    try {
      const { token: t, user: u } = await apiPost('/auth/login', { usernameOrEmail, password });
      await FileSystem.writeAsStringAsync(TOKEN_FILE, t);
      setToken(t);
      setUser(u);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string, name?: string) => {
    try {
      const { token: t, user: u } = await apiPost('/auth/signup', { username, email, password, name });
      await FileSystem.writeAsStringAsync(TOKEN_FILE, t);
      setToken(t);
      setUser(u);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await FileSystem.deleteAsync(TOKEN_FILE, { idempotent: true });
    setToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
