import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenLayout } from '@/components/ui/screen-layout';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { compressIfNeeded } from '@/lib/media/manip';
import { openCropper } from '@/lib/media/picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
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

export default function ChatsScreen() {
  const { session, user } = useAuthStore();
  const { fetchUserInfo } = useUserStore();
  const router = useRouter();
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const [selectedPhoto, setSelectedPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Theme colors
  const mutedColor = useThemeColor({}, 'textMuted');
  const errorColor = useThemeColor({}, 'red');
  const textColor = useThemeColor({}, 'text');
  const overlayBackgroundColor = useThemeColor({ light: 'rgba(0, 0, 0, 0.7)', dark: 'rgba(255, 255, 255, 0.7)' }, 'background');

  console.log(`[${timestamp}] [ProfileCompletionScreen] Rendering component`, { userId: user?.id, hasSession: !!session });

  // Empty defaultValues to prevent form prepopulation
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
      username: '',
      avatar_url: '',
    },
  });

  const currentAvatarUrl = watch('avatar_url');
  console.log(`[${timestamp}] [ProfileCompletionScreen] Form initialized`);

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

  // Handle photo selection with cropping, compression, uploading, and prefetching
  const handlePhotoSelection = async (assets: ImagePicker.ImagePickerAsset[]) => {
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
      
      // Step 0: Delete previous avatar if it exists
      const currentAvatarUrl = watch('avatar_url');
      if (currentAvatarUrl) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Deleting previous avatar`);
        try {
          // Extract file path from current avatar URL
          const urlParts = currentAvatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${session.user.id}/${fileName}`;
          
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);
            
          if (deleteError) {
            console.log(`[${timestamp}] [ProfileCompletionScreen] Failed to delete previous avatar`, { error: deleteError });
            // Continue anyway - don't fail the upload because of cleanup failure
          } else {
            console.log(`[${timestamp}] [ProfileCompletionScreen] Previous avatar deleted successfully`);
          }
        } catch (deleteError) {
          console.log(`[${timestamp}] [ProfileCompletionScreen] Error during avatar cleanup`, { deleteError });
          // Continue anyway
        }
      }
      
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
  
      // Step 3: Create file object for upload
      console.log(`[${timestamp}] [ProfileCompletionScreen] Preparing file for upload`);
      
      // Create a file object that Supabase can handle
      const fileUri = compressedImage.path;
      
      // For React Native, we need to create a file-like object
      const file = {
        uri: fileUri,
        type: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`
      };
      
      console.log(`[${timestamp}] [ProfileCompletionScreen] File prepared`, { file });
  
      // Step 4: Upload to Supabase storage with unique filename
      const fileName = file.name;
      const filePath = `${session.user.id}/${fileName}`;
      
      console.log(`[${timestamp}] [ProfileCompletionScreen] Uploading to Supabase storage`);
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file as any, {
          contentType: 'image/jpeg',
          upsert: false, // Changed to false since we're using unique filenames
        });
  
      if (uploadError) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Upload error`, { error: uploadError.message });
        throw uploadError;
      }
  
      console.log(`[${timestamp}] [ProfileCompletionScreen] Image uploaded successfully`, { 
        filePath, 
        uploadedData: data 
      });
  
      // Step 5: Get the public URL from Supabase
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      console.log(`[${timestamp}] [ProfileCompletionScreen] Public URL generated`, { publicUrl });
  
      // Step 6: Verify the upload by checking if file exists
      const { data: fileData, error: listError } = await supabase.storage
        .from('avatars')
        .list(session.user.id);
      
      if (listError) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Error verifying upload`, { error: listError });
      } else {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Files in bucket`, { files: fileData });
      }
  
      // Step 7: Prefetch the image using the public URL
      console.log(`[${timestamp}] [ProfileCompletionScreen] Prefetching image`);
      try {
        await ExpoImage.prefetch(publicUrl);
        console.log(`[${timestamp}] [ProfileCompletionScreen] Image prefetched successfully`);
      } catch (prefetchError) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Prefetch failed, continuing anyway`, { prefetchError });
      }
  
      // Step 8: Update state with processed image using public URL
      const processedAsset: ImagePicker.ImagePickerAsset = {
        uri: publicUrl,
        width: compressedImage.width,
        height: compressedImage.height,
        fileName: fileName,
        fileSize: compressedImage.size,
        type: 'image',
      };
  
      setSelectedPhoto(processedAsset);
      setValue('avatar_url', publicUrl);
      
      console.log(`[${timestamp}] [ProfileCompletionScreen] Image processing completed`, { 
        processedAsset,
        publicUrl 
      });
  
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[${timestamp}] [ProfileCompletionScreen] Image selected`, { asset: result.assets[0] });
        await handlePhotoSelection(result.assets);
      }
    } catch (error) {
      console.log(`[${timestamp}] [ProfileCompletionScreen] Error picking image`, { error });
      setMediaError('Failed to pick image from gallery');
    }
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
                <Camera size={32} color={mutedColor} />
              </AvatarFallback>
            )}
          </Avatar>
          {isProcessingImage && (
            <View style={[styles.processingOverlay, { backgroundColor: overlayBackgroundColor }]}>
              <Text variant="caption" style={[styles.processingText, { color: textColor }]}>
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
        <Text variant="caption" style={[styles.error, { color: errorColor }]}>
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
        variant="secondary"
        style={styles.submitButton}
      >
        {updateProfileMutation.isPending ? t('profileCompletion.submitting') : t('profileCompletion.submit')}
      </Button>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPressable: {
    position: 'relative',
    shadowColor: '#000', // Kept as is since shadowColor isn't in theme, but could be added to colors.ts if needed
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
    borderWidth: 3
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 12,
    textAlign: 'center',
  },
  setPhotoTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  note: {
    marginBottom: 32,
    textAlign: 'left',
    marginLeft: 14,
  },
  submitButton: {
    width: '100%',
    marginTop: 20,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
});