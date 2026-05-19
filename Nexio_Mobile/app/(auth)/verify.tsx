import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, LogOut } from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';

export default function VerifyScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#EDE4DC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(215,135,106,0.3)', backgroundColor: 'rgba(215,135,106,0.1)' }}>
        <Mail size={32} color="#E8664A" />
      </View>

      <Text style={{ color: '#2B2B2B', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
        Account created
      </Text>
      <Text style={{ color: '#7A7A7A', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
        Signed in as
      </Text>
      <Text style={{ color: '#2B2B2B', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 40 }}>
        {user?.username ?? user?.email}
      </Text>

      <TouchableOpacity
        onPress={signOut}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <LogOut size={13} color="#ADADAD" />
        <Text style={{ color: '#ADADAD', fontSize: 12 }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}
