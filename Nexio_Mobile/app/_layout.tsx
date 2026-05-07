import '../global.css';
import { useEffect } from 'react';
import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { loadSettings } from '../src/services/settingsService';

function RouteGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const segs = segments as string[];
    const inAuth = segs[0] === '(auth)';
    const needsVerify = user && !user.emailVerified && user.provider === 'email';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (needsVerify && !(inAuth && segs[1] === 'verify')) {
      router.replace('/(auth)/verify');
    } else if (user && !needsVerify && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => { loadSettings(); }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RouteGuard />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#EDE4DC' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="create" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="generate" options={{ animation: 'fade', presentation: 'modal' }} />
          <Stack.Screen name="kit" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="listing" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="preview" options={{ animation: 'fade', presentation: 'transparentModal' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
