import { Sparkles, LogOut } from 'lucide-react-native';
import { Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 rounded-lg bg-indigo-600 items-center justify-center">
          <Sparkles size={16} color="#fff" />
        </View>
        <Text className="text-white font-bold text-lg tracking-tight">AdGenius AI</Text>
      </View>

      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View className="items-end">
          <View className="bg-indigo-900/50 border border-indigo-700 rounded-full px-3 py-1 mb-0.5">
            <Text className="text-indigo-300 text-xs font-semibold">
              {user?.role === 'admin' ? 'ADMIN' : 'PRO PLAN'}
            </Text>
          </View>
          <Text className="text-zinc-500 text-xs" numberOfLines={1}>
            {user?.email}
          </Text>
        </View>

        <TouchableOpacity
          onPress={signOut}
          className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 items-center justify-center"
          activeOpacity={0.75}
        >
          <LogOut size={14} color="#71717a" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
