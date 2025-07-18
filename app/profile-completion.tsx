import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaAsset } from '@/components/ui/media-picker';
import { ScreenLayout } from '@/components/ui/screen-layout';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { compressIfNeeded } from '@/lib/media/manip';
import { openCropper } from '@/lib/media/picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { z } from 'zod';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileCompletionScreen() {
  const { session, user } = useAuthStore();
  const { fetchUserInfo } = useUserStore();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const [selectedPhoto, setSelectedPhoto] = useState<MediaAsset | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  console.log(`[${timestamp}] [ProfileCompletionScreen] Rendering component`, { userId: user?.id, hasSession: !!session });

  // Memoize defaultValues to prevent form reinitialization
  const defaultValues = useMemo(
    () => ({
      display_name: user?.user_metadata?.name || '',
      username: '',
      avatar_url: user?.user_metadata?.avatar_url || '',
    }),
    [user?.user_metadata?.name, user?.user_metadata?.avatar_url]
  );

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const currentAvatarUrl = watch('avatar_url');

  console.log(`[${timestamp}] [ProfileCompletionScreen] Form initialized`, { defaultValues });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Calling update_user_profile RPC`, { data });
      const { error } = await supabase.rpc('update_user_profile', {
        p_display_name: data.display_name,
        p_username: data.username,
        p_avatar_url: data.avatar_url || null,
      });
      if (error) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] update_user_profile error`, { error: error.message });
        throw error;
      }
      console.log(`[${timestamp}] [ProfileCompletionScreen] update_user_profile successful`);
    },
    onSuccess: async () => {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Profile update mutation successful`);
      // Fetch updated user info
      console.log(`[${timestamp}] [ProfileCompletionScreen] Fetching updated user info`);
      await fetchUserInfo();
      // Redirect to home
      console.log(`[${timestamp}] [ProfileCompletionScreen] Redirecting to /tabs/home`);
      router.replace('/(tabs)/home');
    },
    onError: (error) => {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Profile update mutation error`, { error: error.message });
      setMediaError(error.message || t('error.generic'));
    },
  });

  // Handle photo selection with cropping, compression, and prefetching
// Handle photo selection with cropping, compression, uploading, and prefetching
const handlePhotoSelection = async (assets: MediaAsset[]) => {
  console.log(`[${timestamp}] [ProfileCompletionScreen] Photo selected`, { assets });
  const photo = assets[0] || null;
  
  if (!photo) {
    setSelectedPhoto(null);
    setValue('avatar_url', '');
    return;
  }

  if (!session?.user?.id) {
    console.log(`[${timestamp}] [ProfileCompletionScreen] No user ID available`);
    setMediaError(t('error.noUserId'));
    return;
  }

  setIsProcessingImage(true);
  setMediaError(null);

  try {
    console.log(`[${timestamp}] [ProfileCompletionScreen] Starting image processing`);
    
    // Step 1: Open cropper
    console.log(`[${timestamp}] [ProfileCompletionScreen] Opening cropper`);
    const croppedImage = await openCropper({
      imageUri: photo.uri,
      shape: 'circle',
      aspectRatio: 1 / 1,
    });

    console.log(`[${timestamp}] [ProfileCompletionScreen] Image cropped`, { croppedImage });

    // Step 2: Compress the cropped image
    console.log(`[${timestamp}] [ProfileCompletionScreen] Compressing image`);
    const compressedImage = await compressIfNeeded(croppedImage, 1000000);

    console.log(`[${timestamp}] [ProfileCompletionScreen] Image compressed`, { 
      originalSize: croppedImage.size,
      compressedSize: compressedImage.size 
    });

    // Step 3: Upload to Supabase storage
    console.log(`[${timestamp}] [ProfileCompletionScreen] Uploading to Supabase storage`);
    const filePath = `avatars/${session.user.id}/avatar.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedImage.path, {
        contentType: 'image/jpeg',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Upload error`, { error: uploadError.message });
      throw uploadError;
    }

    console.log(`[${timestamp}] [ProfileCompletionScreen] Image uploaded`, { filePath });

    // Step 4: Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;
    console.log(`[${timestamp}] [ProfileCompletionScreen] Public URL generated`, { avatarUrl });

    // Step 5: Prefetch the image to prevent flicker
    console.log(`[${timestamp}] [ProfileCompletionScreen] Prefetching image`);
    await ExpoImage.prefetch(avatarUrl);

    console.log(`[${timestamp}] [ProfileCompletionScreen] Image prefetched successfully`);

    // Step 6: Update state with processed image
    const processedAsset: MediaAsset = {
      id: `processed_avatar_${Date.now()}`,
      uri: avatarUrl,
      type: 'image',
      width: compressedImage.width,
      height: compressedImage.height,
      filename: `avatar_${Date.now()}.jpg`,
      fileSize: compressedImage.size,
    };

    setSelectedPhoto(processedAsset);
    setValue('avatar_url', avatarUrl);
    
    console.log(`[${timestamp}] [ProfileCompletionScreen] Image processing completed`, { processedAsset });

  } catch (error) {
    console.log(`[${timestamp}] [ProfileCompletionScreen] Image processing error`, { error });
    setMediaError(error instanceof Error ? error.message : 'Failed to process image');
  } finally {
    setIsProcessingImage(false);
  }
};

  // Handle photo selection directly using ImagePicker
  const handleAvatarPress = async () => {
    if (isProcessingImage) {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Image processing in progress, ignoring avatar press`);
      return;
    }

    try {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Avatar pressed, launching image picker`);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAsset: MediaAsset = {
          id: `avatar_${Date.now()}`,
          uri: asset.uri,
          type: 'image',
          width: asset.width,
          height: asset.height,
          filename: asset.fileName || undefined,
          fileSize: asset.fileSize,
        };
        console.log(`[${timestamp}] [ProfileCompletionScreen] Image selected`, { newAsset });
        await handlePhotoSelection([newAsset]);
      }
    } catch (error) {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Error picking image`, { error });
      handleMediaError('Failed to pick image from gallery');
    }
  };

  // Handle media picker error
  const handleMediaError = (error: string) => {
    console.log(`[${timestamp}] [ProfileCompletionScreen] Media picker error`, { error });
    setMediaError(error);
  };

  const onSubmit = (data: ProfileFormData) => {
    console.log(`[${timestamp}] [ProfileCompletionScreen] Form submitted`, { data });
    updateProfileMutation.mutate(data);
  };

  // Determine which image to show (priority: selectedPhoto > currentAvatarUrl > fallback)
  const avatarImageSource = selectedPhoto?.uri || currentAvatarUrl || null;

  return (
    <ScreenLayout containerStyle={{ paddingHorizontal: 12 }}>
      {/* Form Title */}
      <Text variant="heading" style={styles.title}>
        {t('profileCompletion.title')}
      </Text>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <Pressable 
          onPress={handleAvatarPress} 
          style={[
            styles.avatarPressable,
            (isProcessingImage || updateProfileMutation.isPending) && styles.avatarPressableDisabled
          ]}
          disabled={isProcessingImage || updateProfileMutation.isPending}
        >
          <Avatar size={100} style={styles.avatar}>
            {avatarImageSource ? (
              <AvatarImage source={{ uri: avatarImageSource }} />
            ) : (
              <AvatarFallback>
                <Camera size={32} color="#666" />
              </AvatarFallback>
            )}
          </Avatar>
          {isProcessingImage && (
            <View style={styles.processingOverlay}>
              <Text variant="caption" style={styles.processingText}>
                Processing...
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable 
          onPress={handleAvatarPress} 
          disabled={isProcessingImage || updateProfileMutation.isPending}
          style={(isProcessingImage || updateProfileMutation.isPending) && styles.avatarPressableDisabled}
        >
          <Text variant="link" style={styles.setPhotoTitle}>
            {t('completeProfile.setNewPhoto', { defaultValue: 'Set New Photo' })}
          </Text>
        </Pressable>
     </View>
      {/* Form Fields */}
      <Controller
        control={control}
        name="display_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('profileCompletion.displayName')}
            placeholder={t('profileCompletion.displayNamePlaceholder')}
            onBlur={() => {
              console.log(`[${timestamp}] [ProfileCompletionScreen] Display name input blurred`, { value });
              onBlur();
            }}
            onChangeText={(text) => {
              console.log(`[${timestamp}] [ProfileCompletionScreen] Display name input changed`, { text });
              onChange(text);
            }}
            value={value}
            error={errors.display_name?.message}
            disabled={updateProfileMutation.isPending || isProcessingImage}
            containerStyle={styles.inputContainer}
          />
        )}
      />
      <Text variant="note" style={styles.note}>
        {t('profileCompletion.displayNameNote')}
      </Text>      
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('profileCompletion.username')}
            placeholder={t('profileCompletion.usernamePlaceholder')}
            onBlur={() => {
              console.log(`[${timestamp}] [ProfileCompletionScreen] Username input blurred`, { value });
              onBlur();
            }}
            onChangeText={(text) => {
              console.log(`[${timestamp}] [ProfileCompletionScreen] Username input changed`, { text });
              onChange(text);
            }}
            value={value}
            error={errors.username?.message}
            disabled={updateProfileMutation.isPending || isProcessingImage}
            containerStyle={styles.inputContainer}
          />
        )}
      />
      <Text variant="note" style={styles.note}>
        {t('profileCompletion.usernameNote')}
      </Text>
      {/* Hidden avatar_url field */}
      <Controller
        control={control}
        name="avatar_url"
        render={({ field: { value } }) => (
          <View style={{ display: 'none' }}>
            <Input value={value} />
          </View>
        )}
      />
      {mediaError && (
        <Text variant="caption" style={styles.error}>
          {mediaError}
        </Text>
      )}
      <Button
        onPress={() => {
          console.log(`[${timestamp}] [ProfileCompletionScreen] Submit button pressed`);
          handleSubmit(onSubmit)();
        }}
        disabled={updateProfileMutation.isPending || isProcessingImage}
        loading={updateProfileMutation.isPending}
        variant="default"
        style={styles.submitButton}
      >
        {updateProfileMutation.isPending ? t('profileCompletion.submitting') : t('profileCompletion.submit')}
      </Button>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 32, // Increased for better separation
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32, // Consistent with title
  },
  avatarPressable: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPressableDisabled: {
    opacity: 0.6,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  setPhotoTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8, // Consistent spacing between inputs
  },
  note: {
    marginBottom: 32, // Aligned with inputContainer
    textAlign: 'left',
    marginLeft: 14,
  },
  submitButton: {
    width: '100%',
    marginTop: 20, // Slightly larger to separate the button from the form
  },
  error: {
    color: 'red',
    marginBottom: 16, // Consistent with other elements
    textAlign: 'center',
  },
});