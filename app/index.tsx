import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { useModeToggle } from '../hooks/useModeToggle';
import { useThemeColor } from '../hooks/useThemeColor';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const { session, loading, error, signInWithGoogle } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const { mode, setMode, isDark } = useModeToggle();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'textMuted');

  console.log(`[${timestamp}] [LoginScreen] Rendering component`, { userId: session?.user?.id, email: session?.user?.email, loading, mode });

  // Check profile completion status
  const { data: needsCompletion, isLoading} = useQuery({
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
    gcTime: 0,
  });

  // Log component mount and state
  useEffect(() => {
    console.log(`[${timestamp}] [LoginScreen] Component mounted`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null, loading });
  }, []);

  // Redirect based on session and profile completion
  useEffect(() => {
    if (session && !isLoading) {
      console.log(`[${timestamp}] [LoginScreen] Checking session and profile completion`, { hasSession: !!session, isLoading, needsCompletion });
      console.log(`[${timestamp}] [LoginScreen] Redirecting to ${needsCompletion ? '/profile-completion' : '/(tabs)/home'}`, { userId: session.user?.id, email: session.user?.email });
      router.replace(needsCompletion ? '/profile-completion' : '/(tabs)/home');
    }
  }, [session, isLoading, needsCompletion, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.log(`[${timestamp}] [LoginScreen] Error occurred`, { error: error.message });
    }
  }, [error]);

  // Placeholder for Microsoft and Apple sign-in (planned features)
  const signInWithMicrosoft = async () => {
    console.log(`[${timestamp}] [LoginScreen] Microsoft sign-in placeholder`);
  };

  const signInWithApple = async () => {
    console.log(`[${timestamp}] [LoginScreen] Apple sign-in placeholder`);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    console.log(`[${timestamp}] [LoginScreen] Theme toggle pressed, current mode: ${mode}`);
    setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light');
  };

  // Handle link presses
  const handleLinkPress = (url: string) => {
    console.log(`[${timestamp}] [LoginScreen] Link pressed`, { url });
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Theme Toggle Button */}
      <View style={styles.themeToggleContainer}>
        <Button
          icon={{ family: 'Ionicons', name: isDark ? 'moon' : 'sunny' }}
          size="lg"
          variant="ghost"
          onPress={handleThemeToggle}
          accessibilityLabel={t('settings.themeToggle')}
        />
      </View>

      {/* Main Title */}
      <Text variant="heading" style={styles.title}>
        Cendy
      </Text>

      {/* Subtitle */}
      <Text variant="caption" style={styles.subtitle}>
        {t('login.subtitle')}
      </Text>

      {/* Social Login Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          icon={{ family: 'AntDesign', name: 'google' }}
          variant="secondary"
          size="lg"
          onPress={() => {
            console.log(`[${timestamp}] [LoginScreen] Google sign-in button pressed`);
            signInWithGoogle();
          }}
          disabled={loading}
        >
          {loading ? t('login.signingIn') : t('login.signIn')}
        </Button>
        <Button
          icon={{ family: 'MaterialCommunityIcons', name: 'microsoft' }}
          variant="secondary"
          size="lg"
          onPress={() => {
            console.log(`[${timestamp}] [LoginScreen] Microsoft sign-in button pressed`);
            signInWithMicrosoft();
          }}
          disabled={loading}
        >
          {t('login.signInMicrosoft')}
        </Button>
        <Button
          icon={{ family: 'AntDesign', name: 'apple1' }}
          variant="secondary"
          size="lg"
          onPress={() => {
            console.log(`[${timestamp}] [LoginScreen] Apple sign-in button pressed`);
            signInWithApple();
          }}
          disabled={loading}
        >
          {t('login.signInApple')}
        </Button>
      </View>

      {/* Footer Legal Text */}
      <View style={styles.footer}>
        <Text variant="caption" style={[styles.footerText, { color: mutedColor }]}>
          {t('login.legalText')}{' '}
          <TouchableOpacity onPress={() => handleLinkPress('https://cendy.app/terms')}>
            <Text variant="link">{t('login.termsOfService')}</Text>
          </TouchableOpacity>{' '}
          {t('login.and')}{' '}
          <TouchableOpacity onPress={() => handleLinkPress('https://cendy.app/privacy')}>
            <Text variant="link">{t('login.privacyPolicy')}</Text>
          </TouchableOpacity>
        </Text>
      </View>
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
  themeToggleContainer: {
    position: 'absolute',
    top: 60,
    right: 0,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 50,
    bottom: 40,
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
    bottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
    top: 140,
  },
  footer: {
    position: 'absolute',
    bottom: 55,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});