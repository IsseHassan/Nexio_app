import { Tabs, router } from 'expo-router';
import { Home, Package, User, Plus } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

function CreateButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/create')}
      activeOpacity={0.85}
      style={{
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: '#5C3BE5',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#5C3BE5', shadowOpacity: 0.55, shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Plus size={26} color="#fff" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0E0E18',
          borderTopColor: '#1A1A28',
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#7C5CF6',
        tabBarInactiveTintColor: '#3A3A52',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-tab"
        options={{
          title: 'Create',
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <CreateButton />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Package size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
