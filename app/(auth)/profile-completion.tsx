import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileCompletionScreen() {
  const { session, user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.user_metadata?.name || '',
      username: '',
      avatar_url: user?.user_metadata?.avatar_url || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const { error } = await supabase.rpc('update_user_profile', {
        p_display_name: data.display_name,
        p_username: data.username,
        p_avatar_url: data.avatar_url || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // Re-check profile completion
      const { data: NeedComplete, error } = await supabase.rpc('check_profile_completion');
      if (error) {
        Alert.alert(t('error.title'), error.message || t('error.generic'));
        return;
      }
      if (NeedComplete === false) {
        // Invalidate query to refresh needsCompletion in other screens
        await queryClient.invalidateQueries({ queryKey: ['profileCompletion', user?.id] });
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(t('error.title'), t('error.generic'));
      }
    },
    onError: (error) => {
      Alert.alert(t('error.title'), error.message || t('error.generic'));
    },
  });

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
    }
  }, [session]);

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profileCompletion.title')}</Text>
      <Controller
        control={control}
        name="display_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('profileCompletion.displayNamePlaceholder')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.display_name && <Text style={styles.error}>{errors.display_name.message}</Text>}
          </View>
        )}
      />
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('profileCompletion.usernamePlaceholder')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
          </View>
        )}
      />
      <Controller
        control={control}
        name="avatar_url"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('profileCompletion.avatarUrlPlaceholder')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.avatar_url && <Text style={styles.error}>{errors.avatar_url.message}</Text>}
          </View>
        )}
      />
      <Button
        title={updateProfileMutation.isPending ? t('profileCompletion.submitting') : t('profileCompletion.submit')}
        onPress={handleSubmit(onSubmit)}
        disabled={updateProfileMutation.isPending}
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
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
});