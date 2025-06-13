import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../stores/authStore';

export default function HomeScreen() {
  const { session, user, loading: authLoading, error, signOut } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  // Log component mount and state
  useEffect(() => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${timestamp}] [HomeScreen] Component mounted`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null, authLoading });
  }, []);

  // Redirect to login if no session
  useEffect(() => {
    if (!session && !authLoading) {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`[${timestamp}] [HomeScreen] No session, redirecting to /login`);
      router.replace('/(auth)/login');
    }
  }, [session, authLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`[${timestamp}] [HomeScreen] Error occurred`, { error: error.message });
      Alert.alert(t('error.title'), error.message || t('error.generic'));
    }
  }, [error]);

  const handleSignOut = async () => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${timestamp}] [HomeScreen] Sign-out button pressed`);
    try {
      await signOut();
      console.log(`[${timestamp}] [HomeScreen] Sign-out initiated, waiting for session state change`);
    } catch (err) {
      console.log(`[${timestamp}] [HomeScreen] Sign-out error`, err);
      Alert.alert(t('error.title'), t('error.signOut'));
    }
  };

  if (authLoading) {
    return <Text>{t('loading')}</Text>;
  }

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.welcome}>
            {t('home.welcome', { name: user.user_metadata?.name || 'User' })}
          </Text>
          <Button title={t('home.signOut')} onPress={handleSignOut} />
        </>
      ) : (
        <Text>{t('home.noUser')}</Text>
      )}
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
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});