import { Sparkles, LogOut } from 'lucide-react-native';
import { Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8664A', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="#fff" />
        </View>
        <Text style={{ color: '#2B2B2B', fontWeight: '700', fontSize: 18, letterSpacing: -0.3 }}>AdGenius AI</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ backgroundColor: 'rgba(215,135,106,0.12)', borderWidth: 1, borderColor: 'rgba(215,135,106,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 2 }}>
            <Text style={{ color: '#E8664A', fontSize: 10, fontWeight: '700' }}>
              {user?.role === 'admin' ? 'ADMIN' : 'PRO PLAN'}
            </Text>
          </View>
          <Text style={{ color: '#7A7A7A', fontSize: 11 }} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>

        <TouchableOpacity
          onPress={signOut}
          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F6F2EE', borderWidth: 1, borderColor: '#CFCBC7', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.75}
        >
          <LogOut size={14} color="#ADADAD" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
