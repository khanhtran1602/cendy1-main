import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../stores/authStore';
import CreatePostModal from './CreatePostModal';

export default function HomeScreen() {
  const { session, user, loading: authLoading, error, signOut } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [isCreatePostVisible, setIsCreatePostVisible] = useState(false);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  console.log(`[${timestamp}] [HomeScreen] Rendering component`, { userId: user?.id, hasSession: !!session, authLoading, isCreatePostVisible });

  // Log component mount and state
  useEffect(() => {
    console.log(`[${timestamp}] [HomeScreen] Component mounted`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null, authLoading });
  }, []);

  // Redirect to login if no session
  useEffect(() => {
    console.log(`[${timestamp}] [HomeScreen] Checking session`, { hasSession: !!session, authLoading });
    if (!session && !authLoading) {
      console.log(`[${timestamp}] [HomeScreen] No session, redirecting to /`);
      router.replace('/');
    }
  }, [session, authLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.log(`[${timestamp}] [HomeScreen] Error occurred`, { error: error.message });
      Alert.alert(t('error.title'), error.message || t('error.generic'));
    }
  }, [error]);

  const handleSignOut = async () => {
    console.log(`[${timestamp}] [HomeScreen] Sign-out button pressed`);
    try {
      await signOut();
      console.log(`[${timestamp}] [HomeScreen] Sign-out initiated, waiting for session state change`);
    } catch (err) {
      console.log(`[${timestamp}] [HomeScreen] Sign-out error`, { error: (err as Error).message });
      Alert.alert(t('error.title'), t('error.signOut'));
    }
  };

  if (authLoading) {
    console.log(`[${timestamp}] [HomeScreen] Rendering loading state`);
    return <Text>{t('loading')}</Text>;
  }

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.welcome}>
            {t('home.welcome', { name: user.user_metadata?.name || 'User' })}
          </Text>
          <Button 
            title={t('home.createPost')} 
            onPress={() => {
              console.log(`[${timestamp}] [HomeScreen] Create post button pressed`);
              setIsCreatePostVisible(true);
            }} 
          />
          <Button 
            title={t('home.signOut')} 
            onPress={() => {
              console.log(`[${timestamp}] [HomeScreen] Sign-out button pressed`);
              handleSignOut();
            }} 
          />
          <CreatePostModal
            visible={isCreatePostVisible}
            onClose={() => {
              console.log(`[${timestamp}] [HomeScreen] Closing CreatePostModal`);
              setIsCreatePostVisible(false);
            }}
          />
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