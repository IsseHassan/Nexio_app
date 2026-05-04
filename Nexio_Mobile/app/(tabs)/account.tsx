import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, CreditCard, Settings, HelpCircle, MessageSquare, Send, LogOut, ChevronRight, Shield } from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';

const BG     = '#0B0B0F';
const CARD   = '#131320';
const BORDER = '#1A1A28';
const PRIMARY = '#5C3BE5';
const TEXT1  = '#FFFFFF';
const TEXT2  = '#8B8BA7';
const TEXT3  = '#3A3A52';

function Row({ icon: Icon, label, value, color = TEXT2, onPress, danger = false }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: danger ? 'rgba(248,113,113,0.1)' : 'rgba(92,59,229,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={danger ? '#f87171' : color} />
      </View>
      <Text style={{ flex: 1, color: danger ? '#f87171' : TEXT1, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      {value && <Text style={{ color: TEXT3, fontSize: 13 }}>{value}</Text>}
      <ChevronRight size={16} color={TEXT3} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />;
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile header */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: CARD, borderWidth: 2, borderColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <User size={32} color={PRIMARY} />
          </View>
          <Text style={{ color: TEXT1, fontWeight: '700', fontSize: 18 }}>Hello, {user?.name || 'User'}!</Text>
          <Text style={{ color: TEXT2, fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
          <View style={{ marginTop: 10, backgroundColor: 'rgba(92,59,229,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(92,59,229,0.3)' }}>
            <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: '700' }}>PRO PLAN</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>Account</Text>
          <Row icon={User}        label="Profile"       color={PRIMARY} />
          <Divider />
          <Row icon={Shield}      label="Subscription"  value="Pro" color={PRIMARY} />
          <Divider />
          <Row icon={CreditCard}  label="Billing"       color={PRIMARY} />
          <Divider />
          <Row icon={Settings}    label="Settings"      color={PRIMARY} />
        </View>

        {/* Support section */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>Support</Text>
          <Row icon={HelpCircle}    label="Help Center"     color={TEXT2} />
          <Divider />
          <Row icon={MessageSquare} label="Contact Us"      color={TEXT2} />
          <Divider />
          <Row icon={Send}          label="Send Feedback"   color={TEXT2} />
        </View>

        {/* Sign out */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' }}>
          <Row icon={LogOut} label="Log Out" onPress={signOut} danger />
        </View>

        <Text style={{ color: TEXT3, fontSize: 11, textAlign: 'center', marginTop: 24 }}>AdGenius v2.2.0</Text>
      </ScrollView>
    </View>
  );
}
