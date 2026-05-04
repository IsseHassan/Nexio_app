import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, LogOut, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';

export default function VerifyScreen() {
  const { user, verifyEmail, sendMagicLink, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [resent, setResent] = useState(false);

  function handleResend() {
    if (user?.email) sendMagicLink(user.email);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <View
      className="flex-1 bg-zinc-950 items-center justify-center px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Icon */}
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.1)' }}
      >
        <Mail size={32} color="#818cf8" />
      </View>

      <Text className="text-white text-2xl font-bold mb-2 text-center">
        Verify your email
      </Text>
      <Text className="text-zinc-400 text-sm text-center mb-1">
        We sent a verification link to
      </Text>
      <Text className="text-zinc-200 text-sm font-semibold text-center mb-3">
        {user?.email}
      </Text>
      <Text className="text-zinc-600 text-xs text-center mb-10 px-4">
        Tap the link in the email to activate your account. Verification is required before generating ads.
      </Text>

      {/* Resend */}
      <TouchableOpacity
        onPress={handleResend}
        disabled={resent}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl items-center justify-center flex-row mb-3"
        style={{ paddingVertical: 14, gap: 8, opacity: resent ? 0.6 : 1 }}
        activeOpacity={0.8}
      >
        <RefreshCw size={14} color="#a1a1aa" />
        <Text className="text-zinc-200 text-sm font-medium">
          {resent ? 'Email sent!' : 'Resend verification email'}
        </Text>
      </TouchableOpacity>

      {/* Dev simulation */}
      <View
        className="w-full rounded-xl mb-6"
        style={{ borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.05)', padding: 14 }}
      >
        <Text
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(245,158,11,0.7)' }}
        >
          Dev / Mock Mode
        </Text>
        <TouchableOpacity
          onPress={() => verifyEmail()}
          className="bg-zinc-800 border border-zinc-700 rounded-xl items-center justify-center"
          style={{ paddingVertical: 13 }}
          activeOpacity={0.8}
        >
          <Text className="text-zinc-200 text-sm font-medium">
            Simulate email click → verify now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={signOut}
        className="flex-row items-center"
        style={{ gap: 6 }}
      >
        <LogOut size={13} color="#52525b" />
        <Text className="text-zinc-600 text-xs">Sign out</Text>
      </TouchableOpacity>

      <Text className="text-zinc-700 text-xs uppercase tracking-widest mt-10">
        Mock auth · no real emails sent
      </Text>
    </View>
  );
}
