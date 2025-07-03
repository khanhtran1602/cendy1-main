import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memo, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUserSettingsStore } from '../stores/userSettingsStore';

// Define form schema
const postSchema = z.object({
  channel: z.enum(['Campus Feed', 'Campus Connect', 'Global Feed', 'Global Connect'], {
    errorMap: () => ({ message: 'Please select a channel' }),
  }),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  category: z.string().min(1, 'Category is required'),
  bodytext: z.string().min(10, 'Body text must be at least 10 characters').max(2000, 'Body text must be less than 2000 characters'),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

function CreatePostModal({ visible, onClose }: CreatePostModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { college } = useUserSettingsStore();
  const [channelPickerVisible, setChannelPickerVisible] = useState(false);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  console.log(`[${timestamp}] [CreatePostModal] Rendering component`, { visible, userId: user?.id, college });

  // Memoize defaultValues to prevent form reinitialization
  const defaultValues = useMemo(
    () => ({
      channel: 'Campus Feed' as const,
      title: '',
      category: '',
      bodytext: '',
      image_url: '',
    }),
    []
  );

  const { control, handleSubmit, formState: { errors }, reset } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues,
  });

  console.log(`[${timestamp}] [CreatePostModal] Form initialized`, { defaultValues });

  // Mutation to create post
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      console.log(`[${timestamp}] [CreatePostModal] Calling create_post RPC`, { data, userId: user?.id });
      if (!user || !college) throw new Error(t('error.unauthenticated'));
      const { data: postId, error } = await supabase.rpc('create_post', {
        p_title: data.title,
        p_bodytext: data.bodytext,
        p_channel: data.channel,
        p_category: data.category,
        p_image_url: data.image_url || null,
        p_user_id: user.id,
      });
      if (error) {
        console.log(`[${timestamp}] [CreatePostModal] create_post error`, { error: error.message });
        throw error;
      }
      console.log(`[${timestamp}] [CreatePostModal] create_post successful`, { postId });
      return postId;
    },
    onSuccess: async () => {
      console.log(`[${timestamp}] [CreatePostModal] Post creation mutation successful`);
      console.log(`[${timestamp}] [CreatePostModal] Invalidating posts query`, { college });
      await queryClient.invalidateQueries({ queryKey: ['posts', college] });
      console.log(`[${timestamp}] [CreatePostModal] Resetting form`);
      reset();
      console.log(`[${timestamp}] [CreatePostModal] Closing modal`);
      onClose();
      Alert.alert(t('success.title'), t('success.postCreated'));
    },
    onError: (error) => {
      console.log(`[${timestamp}] [CreatePostModal] Post creation mutation error`, { error: error.message });
      Alert.alert(t('error.title'), error.message || t('error.generic'));
    },
  });

  const onSubmit = (data: PostFormData) => {
    console.log(`[${timestamp}] [CreatePostModal] Form submitted`, { data });
    createPostMutation.mutate(data);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        console.log(`[${timestamp}] [CreatePostModal] Modal close requested`);
        onClose();
      }}
    >
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        extraKeyboardSpace={100}
      >
        <Text style={styles.title}>{t('createPost.title')}</Text>

        {/* Channel Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.channel')}</Text>
          <Controller
            control={control}
            name="channel"
            render={({ field: { value, onChange } }) => (
              <>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    console.log(`[${timestamp}] [CreatePostModal] Channel picker button pressed`);
                    setChannelPickerVisible(true);
                  }}
                >
                  <Text>{value || t('createPost.selectChannel')}</Text>
                </TouchableOpacity>
                {channelPickerVisible && (
                  <View style={styles.pickerOptions}>
                    {(['Campus Feed', 'Campus Connect', 'Global Feed', 'Global Connect'] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.pickerOption}
                        onPress={() => {
                          console.log(`[${timestamp}] [CreatePostModal] Channel option selected`, { option });
                          onChange(option);
                          setChannelPickerVisible(false);
                        }}
                      >
                        <Text>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          />
          {errors.channel && <Text style={styles.error}>{errors.channel.message}</Text>}
        </View>

        {/* Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.titleLabel')}</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder={t('createPost.titlePlaceholder')}
                onBlur={() => {
                  console.log(`[${timestamp}] [CreatePostModal] Title input blurred`, { value });
                  onBlur();
                }}
                onChangeText={(text) => {
                  console.log(`[${timestamp}] [CreatePostModal] Title input changed`, { text });
                  onChange(text);
                }}
                value={value}
              />
            )}
          />
          {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}
        </View>

        {/* Category */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.category')}</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder={t('createPost.categoryPlaceholder')}
                onBlur={() => {
                  console.log(`[${timestamp}] [CreatePostModal] Category input blurred`, { value });
                  onBlur();
                }}
                onChangeText={(text) => {
                  console.log(`[${timestamp}] [CreatePostModal] Category input changed`, { text });
                  onChange(text);
                }}
                value={value}
              />
            )}
          />
          {errors.category && <Text style={styles.error}>{errors.category.message}</Text>}
        </View>

        {/* Body Text */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.bodytext')}</Text>
          <Controller
            control={control}
            name="bodytext"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.bodyInput]}
                placeholder={t('createPost.bodytextPlaceholder')}
                onBlur={() => {
                  console.log(`[${timestamp}] [CreatePostModal] Body text input blurred`, { value });
                  onBlur();
                }}
                onChangeText={(text) => {
                  console.log(`[${timestamp}] [CreatePostModal] Body text input changed`, { text: text.substring(0, 50) + (text.length > 50 ? '...' : '') });
                  onChange(text);
                }}
                value={value}
                multiline
                numberOfLines={5}
              />
            )}
          />
          {errors.bodytext && <Text style={styles.error}>{errors.bodytext.message}</Text>}
        </View>

        {/* Image URL */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.imageUrl')}</Text>
          <Controller
            control={control}
            name="image_url"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder={t('createPost.imageUrlPlaceholder')}
                onBlur={() => {
                  console.log(`[${timestamp}] [CreatePostModal] Image URL input blurred`, { value });
                  onBlur();
                }}
                onChangeText={(text) => {
                  console.log(`[${timestamp}] [CreatePostModal] Image URL input changed`, { text });
                  onChange(text);
                }}
                value={value}
              />
            )}
          />
          {errors.image_url && <Text style={styles.error}>{errors.image_url.message}</Text>}
        </View>

        {/* Placeholder for Polling */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('createPost.polling')}</Text>
          <Text style={styles.placeholderText}>{t('createPost.pollingPlaceholder')}</Text>
        </View>

        {/* Submit and Cancel Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, createPostMutation.isPending && styles.buttonDisabled]}
            onPress={() => {
              console.log(`[${timestamp}] [CreatePostModal] Submit button pressed`);
              handleSubmit(onSubmit)();
            }}
            disabled={createPostMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {createPostMutation.isPending ? t('createPost.submitting') : t('createPost.submit')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              console.log(`[${timestamp}] [CreatePostModal] Cancel button pressed`);
              onClose();
            }}
          >
            <Text style={styles.buttonText}>{t('createPost.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  bodyInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#f9f9f9',
  },
  pickerOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#888',
    fontStyle: 'italic',
  },
});

export default memo(CreatePostModal);