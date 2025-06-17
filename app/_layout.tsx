import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n/i18n'; // Initialize i18next
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient();
// Dismiss the in-app browser after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const pathname = usePathname();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  useEffect(() => {
    console.log(`[${timestamp}] [RootLayout] Rendering with pathname: ${pathname}`);
  }, [pathname]);

  // Clean up Supabase subscriptions on unmount
  useEffect(() => {
    console.log(`[${timestamp}] [RootLayout] Mounting component`);
    return () => {
      console.log(`[${timestamp}] [RootLayout] Unmounting, cleaning up auth subscription`);
      supabase.auth.onAuthStateChange(() => {}).data.subscription.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="profile-completion" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}