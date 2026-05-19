import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { loadSettings } from '../src/services/settingsService';
import { isOnboardingComplete } from './onboarding';

function RouteGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    isOnboardingComplete().then(done => {
      const segs = segments as string[];
      const inOnboarding = segs[0] === 'onboarding';
      const inAuth = segs[0] === '(auth)';

      if (!done && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }
      if (done && !user && !inAuth) {
        router.replace('/(auth)/login');
        return;
      }
      if (done && user && inAuth) {
        router.replace('/(tabs)');
      }
    });
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
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="video" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
