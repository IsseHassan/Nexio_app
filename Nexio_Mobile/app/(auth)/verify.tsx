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
      style={{ flex: 1, backgroundColor: '#EDE4DC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Icon */}
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ borderWidth: 1, borderColor: 'rgba(215,135,106,0.3)', backgroundColor: 'rgba(215,135,106,0.1)' }}
      >
        <Mail size={32} color="#E8664A" />
      </View>

      <Text style={{ color: '#2B2B2B', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
        Verify your email
      </Text>
      <Text style={{ color: '#7A7A7A', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
        We sent a verification link to
      </Text>
      <Text style={{ color: '#2B2B2B', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
        {user?.email}
      </Text>
      <Text style={{ color: '#ADADAD', fontSize: 12, textAlign: 'center', marginBottom: 40, paddingHorizontal: 16 }}>
        Tap the link in the email to activate your account. Verification is required before generating ads.
      </Text>

      {/* Resend */}
      <TouchableOpacity
        onPress={handleResend}
        disabled={resent}
        style={{ paddingVertical: 14, gap: 8, opacity: resent ? 0.6 : 1, width: '100%', backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 12 }}
        activeOpacity={0.8}
      >
        <RefreshCw size={14} color="#7A7A7A" />
        <Text style={{ color: '#2B2B2B', fontSize: 14, fontWeight: '500' }}>
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
          style={{ paddingVertical: 13, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#2B2B2B', fontSize: 14, fontWeight: '500' }}>
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
        <LogOut size={13} color="#ADADAD" />
        <Text style={{ color: '#ADADAD', fontSize: 12 }}>Sign out</Text>
      </TouchableOpacity>

      <Text style={{ color: '#CFCBC7', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginTop: 40 }}>
        Mock auth · no real emails sent
      </Text>
    </View>
  );
}
