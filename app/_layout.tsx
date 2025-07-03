import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n/i18n'; // Initialize i18next
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const queryClient = new QueryClient();
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuthStore();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  useEffect(() => {
    console.log(`[${timestamp}] [RootLayout] Rendering with pathname: ${pathname}`);
  }, [pathname]);

  // Redirect to login if no session for protected routes
  useEffect(() => {
    console.log(`[${timestamp}] [RootLayout] Checking session for pathname: ${pathname}`, { hasSession: !!session });
    if (!session && pathname !== '/') {
      console.log(`[${timestamp}] [RootLayout] No session, redirecting to /`);
      router.replace('/');
    }
  }, [session, pathname]);

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