import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as mock from './mockAuth';
import type { MockUser, Session } from './mockAuth';

interface AuthCtx {
  user: MockUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => { error?: string };
  signUp: (email: string, password: string, name?: string) => { error?: string };
  signInWithOAuth: (provider: 'google' | 'apple') => void;
  sendMagicLink: (email: string) => void;
  verifyMagicLink: (token: string) => { error?: string };
  sendPasswordReset: (email: string) => { error?: string };
  resetPassword: (token: string, newPass: string) => { error?: string };
  verifyEmail: () => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In-memory mock: check if a session exists (only survives hot-reload)
    setSession(mock.getSession());
    setLoading(false);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const { session: s, error } = mock.signIn(email, password);
    if (s) setSession(s);
    return { error };
  }, []);

  const signUp = useCallback((email: string, password: string, name?: string) => {
    const { session: s, error } = mock.signUp(email, password, name);
    if (s) setSession(s);
    return { error };
  }, []);

  const signInWithOAuth = useCallback((provider: 'google' | 'apple') => {
    const s = mock.signInWithOAuth(provider);
    setSession(s);
  }, []);

  const sendMagicLink = useCallback((email: string) => {
    mock.sendMagicLink(email);
  }, []);

  const verifyMagicLink = useCallback((token: string) => {
    const { session: s, error } = mock.verifyMagicLink(token);
    if (s) setSession(s);
    return { error };
  }, []);

  const sendPasswordReset = useCallback((email: string) => {
    return mock.sendPasswordReset(email);
  }, []);

  const resetPassword = useCallback((token: string, newPass: string) => {
    return mock.resetPassword(token, newPass);
  }, []);

  const verifyEmail = useCallback(() => {
    if (!session) return;
    mock.verifyEmail(session.user.id);
    setSession(s => s ? { ...s, user: { ...s.user, emailVerified: true } } : null);
  }, [session]);

  const signOut = useCallback(() => {
    mock.signOut();
    setSession(null);
  }, []);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signUp,
      signInWithOAuth,
      sendMagicLink,
      verifyMagicLink,
      sendPasswordReset,
      resetPassword,
      verifyEmail,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
