// This file serves as the login screen and root route handler
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const { session, loading, error, signInWithGoogle } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  console.log(`[${timestamp}] [LoginScreen] Rendering component`, { userId: session?.user?.id, email: session?.user?.email, loading });

  // Check profile completion status
  const { data: needsCompletion, isLoading: isChecking } = useQuery({
    queryKey: ['profileCompletion', session?.user?.id],
    queryFn: async () => {
      console.log(`[${timestamp}] [LoginScreen] Calling check_profile_completion RPC`);
      const { data, error } = await supabase.rpc('check_profile_completion');
      if (error) {
        console.log(`[${timestamp}] [LoginScreen] check_profile_completion error`, { error: error.message });
        throw error;
      }
      console.log(`[${timestamp}] [LoginScreen] check_profile_completion result`, { data });
      return data as boolean;
    },
    enabled: !!session,
  });

  // Log component mount and state
  useEffect(() => {
    console.log(`[${timestamp}] [LoginScreen] Component mounted`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null, loading });
  }, []);

  // Redirect based on session and profile completion
  useEffect(() => {
    console.log(`[${timestamp}] [LoginScreen] Checking session and profile completion`, { hasSession: !!session, isChecking, needsCompletion });
    if (session && !isChecking) {
      console.log(`[${timestamp}] [LoginScreen] Redirecting to ${needsCompletion ? '/profile-completion' : '/tabs/home'}`, { userId: session.user?.id, email: session.user?.email });
      router.replace(needsCompletion ? '/profile-completion' : '/(tabs)/home');
    }
  }, [session, needsCompletion, isChecking]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.log(`[${timestamp}] [LoginScreen] Error occurred`, { error: error.message });
      Alert.alert(t('error.title'), error.message || t('error.generic'));
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('login.title')}</Text>
      <Button
        title={loading ? t('login.signingIn') : t('login.signIn')}
        onPress={() => {
          console.log(`[${timestamp}] [LoginScreen] Sign-in button pressed`);
          signInWithGoogle();
        }}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});