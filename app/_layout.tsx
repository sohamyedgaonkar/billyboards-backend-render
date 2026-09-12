console.log('[DEBUG] _layout.tsx: File starts executing');

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ErrorBoundary removed to prevent undefined property crashes in SDK 57

export const unstable_settings = {
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('[DEBUG] _layout.tsx: RootLayout component rendering');

  useEffect(() => {
    console.log('[DEBUG] _layout.tsx: Forcing splash hide in 500ms');
    setTimeout(() => {
      console.log('[DEBUG] _layout.tsx: Calling SplashScreen.hideAsync()');
      SplashScreen.hideAsync();
    }, 500);
  }, []);

  console.log('[DEBUG] _layout.tsx: Returning RootLayoutNav');
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log('[DEBUG] _layout.tsx: RootLayoutNav component rendering');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
