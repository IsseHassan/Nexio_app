import React from 'react';
import { useAuth } from './AuthContext';
import AuthScreen from './AuthScreen';
import VerifyEmailScreen from './VerifyEmailScreen';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  // OAuth and magic_link users are auto-verified; only email signups need verification
  if (!user.emailVerified && user.provider === 'email') return <VerifyEmailScreen />;

  return <>{children}</>;
}
