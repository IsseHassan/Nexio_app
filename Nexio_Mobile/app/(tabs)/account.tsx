import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User, CreditCard, Settings, HelpCircle, MessageSquare,
  Send, LogOut, ChevronRight, Shield, Server, Check, RotateCcw,
} from 'lucide-react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { getServerUrl, saveServerUrl, resetServerUrl } from '../../src/services/settingsService';

const BG      = '#EDE4DC';
const CARD    = '#F6F2EE';
const BORDER  = '#CFCBC7';
const PRIMARY = '#E8664A';
const TEXT1   = '#2B2B2B';
const TEXT2   = '#7A7A7A';
const TEXT3   = '#ADADAD';
const GREEN   = '#34C759';

function Row({ icon: Icon, label, value, color = TEXT2, onPress, danger = false }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: danger ? 'rgba(212,106,90,0.1)' : 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={danger ? '#D46A5A' : color} />
      </View>
      <Text style={{ flex: 1, color: danger ? '#D46A5A' : TEXT1, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      {value && <Text style={{ color: TEXT3, fontSize: 13 }}>{value}</Text>}
      <ChevronRight size={16} color={TEXT3} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16 }} />;
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={{ color: TEXT3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
      {title}
    </Text>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    setUrlInput(getServerUrl());
  }, []);

  function openUrlEdit() {
    setUrlInput(getServerUrl());
    setEditingUrl(true);
    setSaved(false);
  }

  async function handleSaveUrl() {
    const trimmed = urlInput.trim().replace(/\/+$/, '');
    if (!trimmed) { Alert.alert('Invalid URL', 'Please enter a valid server URL.'); return; }
    if (!trimmed.startsWith('http')) { Alert.alert('Invalid URL', 'URL must start with http:// or https://'); return; }
    setSaving(true);
    try {
      await saveServerUrl(trimmed);
      setSaved(true);
      setTimeout(() => { setEditingUrl(false); setSaved(false); }, 1200);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await resetServerUrl();
    setUrlInput(getServerUrl());
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

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
          <View style={{ marginTop: 10, backgroundColor: 'rgba(232,102,74,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(232,102,74,0.3)' }}>
            <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: '700' }}>PRO PLAN</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, overflow: 'hidden' }}>
          <SectionLabel title="Account" />
          <Row icon={User}       label="Profile"      color={PRIMARY} />
          <Divider />
          <Row icon={Shield}     label="Subscription" value="Pro" color={PRIMARY} />
          <Divider />
          <Row icon={CreditCard} label="Billing"      color={PRIMARY} />
          <Divider />
          <Row icon={Settings}   label="Settings"     color={PRIMARY} />
        </View>

        {/* Server URL section */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, overflow: 'hidden' }}>
          <SectionLabel title="Server" />
          <TouchableOpacity
            onPress={openUrlEdit}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(232,102,74,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT1, fontSize: 15, fontWeight: '500' }}>Server URL</Text>
              <Text style={{ color: TEXT3, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{getServerUrl()}</Text>
            </View>
            <ChevronRight size={16} color={TEXT3} />
          </TouchableOpacity>

          {editingUrl && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: BORDER }}>
              <Text style={{ color: TEXT2, fontSize: 12, marginTop: 12, marginBottom: 8 }}>
                Enter your backend server URL (e.g. http://192.168.1.5:8080 or https://yourngrok.app)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="http://192.168.1.x:8080"
                  placeholderTextColor={TEXT3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={{
                    flex: 1, backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
                    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
                    color: TEXT1, fontSize: 14,
                  }}
                />
                <TouchableOpacity
                  onPress={handleSaveUrl}
                  disabled={saving}
                  activeOpacity={0.85}
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: saved ? GREEN : PRIMARY, alignItems: 'center', justifyContent: 'center' }}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : saved
                      ? <Check size={18} color="#fff" strokeWidth={2.5} />
                      : <Check size={18} color="#fff" strokeWidth={2.5} />
                  }
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}
              >
                <RotateCcw size={13} color={TEXT3} />
                <Text style={{ color: TEXT3, fontSize: 12 }}>Reset to default</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Support section */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, marginBottom: 16, overflow: 'hidden' }}>
          <SectionLabel title="Support" />
          <Row icon={HelpCircle}    label="Help Center"   color={TEXT2} />
          <Divider />
          <Row icon={MessageSquare} label="Contact Us"    color={TEXT2} />
          <Divider />
          <Row icon={Send}          label="Send Feedback" color={TEXT2} />
        </View>

        {/* Sign out */}
        <View style={{ marginHorizontal: 20, backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' }}>
          <Row icon={LogOut} label="Log Out" onPress={signOut} danger />
        </View>

        <Text style={{ color: TEXT3, fontSize: 11, textAlign: 'center', marginTop: 24 }}>Nexio v2.2.0</Text>
      </ScrollView>
    </View>
  );
}
