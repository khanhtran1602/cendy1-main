import { Button } from '@/components/ui/button';
import SheetNavigation from '@/modules/home/components/sheethome';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import CreatePostModal from '../../../components/CreatePostModal';
import { useAuthStore } from '../../../stores/authStore';

export default function HomeScreen() {
  const { session, user, loading: authLoading, error, signOut } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [isCreatePostVisible, setIsCreatePostVisible] = useState(false);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  useEffect(() => {
    console.log(`[${timestamp}] [HomeScreen] Component mounted`, {
      session: session ? { userId: session.user?.id, email: session.user?.email } : null,
      authLoading,
    });
  }, []);

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

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tabs.home'),
          headerShown: true,
          headerLeft: () => (
            <SheetNavigation />
          ),
          headerRight: () => (
            <Button
              variant="ghost"
              size="icon"
              icon={{ family: 'Feather', name: 'search' }}
              onPress={() => {
                console.log(`[${timestamp}] [HomeScreen] Search button pressed`);
                router.push('/search');
              }}
              style={styles.headerButton}
            />
          ),
        }}
      />

      <View style={styles.container}>
        {user ? (
          <>
            <Button
              label={t('home.createPost')}
              onPress={() => {
                console.log(`[${timestamp}] [HomeScreen] Create post button pressed`);
                setIsCreatePostVisible(true);
              }}
            />
            <Button
              label={t('home.signOut')}
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
          <Text style={styles.welcome}>{t('home.welcome')}</Text>
        )}
      </View>
    </>
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
  headerButton: {
    marginHorizontal: 10,
    marginLeft: 0,
    marginRight: 0,
  },
  navigationContainer: {
    padding: 16,
    gap: 8,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navigationText: {
    fontSize: 16,
    fontWeight: '500',
  },
});