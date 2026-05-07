import { Tabs, router } from 'expo-router';
import { Home, Box, Plus, Sparkles, User } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

function CreateButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/create')}
      activeOpacity={0.85}
      style={{
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: '#E8664A',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#E8664A', shadowOpacity: 0.45, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Plus size={26} color="#fff" strokeWidth={2.2} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#EDE4DC',
          borderTopColor: '#CFCBC7',
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#E8664A',
        tabBarInactiveTintColor: '#ADADAD',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Kits',
          tabBarIcon: ({ color }) => <Box size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="create-tab"
        options={{
          title: '',
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CreateButton />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-tools"
        options={{
          title: 'AI Tools',
          tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
