import { atoms as a } from '@/alf/atoms';
import { native } from '@/alf/util/platform';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger
} from '@/components/ui/combobox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CHANNELS, PREDEFINED_TOPICS } from '@/lib/constants';
import { isIOS } from '@/platform/detection';
import { type ComposerOpts, useComposerControls } from '@/state/shell/composer';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { BORDER_RADIUS, FONT_SIZE } from '@/theme/globals';
import { OpenCameraBtn } from '@/view/com/composer/photos/OpenCameraBtn'; // Import the OpenCameraBtn component
import { NoVideoState, VideoState } from '@/view/com/composer/state/video';
import { TextInputRef } from '@/view/com/composer/text-input/TextInput';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  type StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  type ViewStyle
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CancelRef = {
  onPressCancel: () => void
}

type Props = ComposerOpts

export const Composer= ({
  replyTo,
  onPost,
  onPostSuccess,
  text,
  imageUris: initImageUris,
  videoUri: initVideoUri,
  cancelRef,
}: Props & { cancelRef?: React.RefObject<CancelRef> }) => {
  const {user} = useAuthStore()
  const currentid = user!.id
  const {closeComposer} = useComposerControls()
  const textInput = useRef<TextInputRef>(null)

  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('Campus Talk');
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  // User data
  const { display_name, username, avatar_url } = useUserStore();

  // Check if post can be submitted
  const canPost = content.trim().length > 0;

  const handlePost = () => {
    if (canPost) {
      onPost?.(content, topic || undefined, channel);
    }
  };

  const handleAddTopic = () => {
    setShowTopicSelector(true);
  };

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setShowTopicSelector(false);
  };

  const handleRemoveTopic = () => {
    setTopic('');
  };

  // Input accessory view ID for iOS
  const inputAccessoryViewID = 'mediaToolbar';

  // Estimate the header height for keyboard offset
  const estimatedHeaderHeight = 50 + 16 + 16;

  const keyboardVerticalOffset = useKeyboardVerticalOffset()


  // Media toolbar component
  const MediaToolbar = () => (
    <View style={[styles.keyboardToolbar, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
      <View style={styles.mediaButtons}>
        {/* Replace TouchableOpacity with OpenCameraBtn */}
        <OpenCameraBtn
          disabled={media?.type === 'images' ? isMaxImages : !!media}
          onAdd={onImageAdd || (() => {})}
          style={styles.mediaButton}
          iconColor={mutedColor}
        />
        <TouchableOpacity
          onPress={() => onMediaSelect?.('photo')}
          style={styles.mediaButton}
        >
          <Icon
            family="Ionicons"
            name="image-outline"
            size={22}
            color={mutedColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMediaSelect?.('microphone')}
          style={styles.mediaButton}
        >
          <Icon
            family="Ionicons"
            name="mic-outline"
            size={22}
            color={mutedColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={isIOS ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        testID="composePostView"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
            aria-modal
              <TouchableOpacity onPress={onCancel}>
                <Text style={{ color: textColor, fontSize: FONT_SIZE }}>Cancel</Text>
              </TouchableOpacity>
              <View>
                <Text variant="subtitle" style={{ color: textColor, fontSize: FONT_SIZE }}>
                  New thread
                </Text>
              </View>
              <TouchableOpacity
                onPress={handlePost}
                disabled={!canPost}
              >
                <Text variant='subtitle'
                  style={[
                    { color: canPost ? 'black' : mutedColor, fontSize: FONT_SIZE }
                  ]}
                >
                  Post
                </Text>
              </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
              <View style={styles.contentContainer}>
                <View style={styles.content}>
                  <View style={styles.mainRow}>
                    {/* Profile Picture */}
                    <View style={styles.profileSection}>
                      <Avatar size={50}>
                        <AvatarImage
                          source={{
                            uri: avatar_url || `https://ui-avatars.com/api/?name=${display_name || username || 'User'}&background=random`
                          }}
                        />
                        <AvatarFallback>
                          {(display_name || username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </View>
                    {/* User Info and Topic Section */}
                    <View style={styles.rightColumn}>
                      {/* User Info and Channel Selector */}
                      <View style={styles.userInfoSection}>
                        <View style={styles.userInfoRow}>
                          <Text variant="body" style={{ fontWeight: '600' }}>
                            {display_name || username || 'User'}
                          </Text>
                          <Icon
                            family="Ionicons"
                            name="chevron-forward"
                            size={16}
                            color={mutedColor}
                            style={styles.chevronIcon}
                          />
                          <Combobox value={channel} onValueChange={setChannel}>
                            <ComboboxTrigger style={styles.channelTrigger}>
                              <Text variant="body" style={styles.channelText}>
                                {channel}
                              </Text>
                            </ComboboxTrigger>
                            <ComboboxContent>
                              <ComboboxInput placeholder="Search..." />
                              <ComboboxList>
                                <ComboboxEmpty>No channels found</ComboboxEmpty>
                                {CHANNELS.map((channelOption) => (
                                  <ComboboxItem key={channelOption} value={channelOption}>
                                    {channelOption}
                                  </ComboboxItem>
                                ))}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </View>
                      </View>
                      {/* Topic Badge or Add Topic */}
                      <View style={styles.topicSection}>
                        {topic ? (
                          <View style={styles.selectedTopicContainer}>
                            <Badge variant="outline" style={styles.topicBadge}>
                              <View style={styles.badgeContent}>
                                <Icon
                                  family="Ionicons"
                                  name="star"
                                  size={14}
                                  color={primaryColor}
                                />
                                <Text style={[styles.badgeText, { color: primaryColor }]}>
                                  {topic}
                                </Text>
                                <TouchableOpacity onPress={handleRemoveTopic} style={styles.removeTopic}>
                                  <Icon
                                    family="Ionicons"
                                    name="close"
                                    size={14}
                                    color={mutedColor}
                                  />
                                </TouchableOpacity>
                              </View>
                            </Badge>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={handleAddTopic} style={styles.addTopicBadge}>
                            <Badge variant="outline" style={styles.topicBadge}>
                              <View style={styles.badgeContent}>
                                <Icon
                                  family="Ionicons"
                                  name="star-outline"
                                  size={14}
                                  color={mutedColor}
                                />
                                <Text style={[styles.badgeText, { color: mutedColor }]}>
                                  Add a topic
                                </Text>
                              </View>
                            </Badge>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                  {/* Input Section */}
                  <View style={styles.inputSection}>
                    {/* Main Text Input */}
                    <TextInput
                      ref={textInputRef}
                      value={content}
                      onChangeText={setContent}
                      placeholder="What's new?"
                      placeholderTextColor={mutedColor}
                      style={[styles.textInput, { color: textColor }]}
                      multiline
                      textAlignVertical="top"
                      inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                    />
                    
                    {/* Media toolbar for Android - shown inline */}
                    {Platform.OS === 'android' && (
                      <MediaToolbar />
                    )}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>

            {/* Topic Selector Modal */}
            {showTopicSelector && (
              <View style={styles.topicSelectorOverlay}>
                <View style={[styles.topicSelectorModal, { backgroundColor: cardColor }]}>
                  <View style={[styles.topicSelectorHeader, { borderBottomColor: borderColor }]}>
                    <Text variant="subtitle" style={{ color: textColor }}>
                      Select a topic
                    </Text>
                    <TouchableOpacity onPress={() => setShowTopicSelector(false)}>
                      <Icon
                        family="Ionicons"
                        name="close"
                        size={24}
                        color={mutedColor}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.topicGrid}>
                    {PREDEFINED_TOPICS.map((topicOption) => (
                      <TouchableOpacity
                        key={topicOption}
                        onPress={() => handleTopicSelect(topicOption)}
                        style={styles.topicOption}
                      >
                        <Badge variant="outline" style={styles.topicOptionBadge}>
                          <View style={styles.badgeContent}>
                            <Icon
                              family="Ionicons"
                              name="star-outline"
                              size={14}
                              color={primaryColor}
                            />
                            <Text style={[styles.badgeText, { color: primaryColor }]}>
                              {topicOption}
                            </Text>
                          </View>
                        </Badge>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* iOS Input Accessory View - appears above keyboard */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <MediaToolbar />
        </InputAccessoryView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
     flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileSection: {
    marginRight: 12,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column',
    marginTop: -4,
  },
  userInfoSection: {
    marginBottom: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronIcon: {
    marginHorizontal: 4,
  },
  channelTrigger: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 'auto',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  channelText: {
    transform: [{ translateY: -1 }],
    fontWeight: '600',
  },
  topicSection: {
    alignSelf: 'flex-start',
  },
  selectedTopicContainer: {
    alignSelf: 'flex-start',
  },
  addTopicBadge: {
    alignSelf: 'flex-start',
  },
  topicBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeTopic: {
    marginLeft: 4,
    padding: 2,
  },
  inputSection: {
    flex: 1,
  },
  textInput: {
    fontSize: FONT_SIZE,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingVertical: 0,
    flex: 1,
  },
  // New styles for keyboard toolbar
  keyboardToolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    marginRight: 20,
    padding: 4,
  },
  topicSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  topicSelectorModal: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  topicSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topicGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicOption: {
    marginBottom: 8,
  },
  topicOptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginLeft: 12,
  },
  topbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 54,
    gap: 4,
  },
});

function useKeyboardVerticalOffset() {
  const {top, bottom} = useSafeAreaInsets()

  // Android etc
  if (!isIOS) {
    // need to account for the edge-to-edge nav bar
    return bottom * -1
  }

  // iPhone SE
  if (top === 20) return 40

  // all other iPhones
  return top + 10
}

function ComposerTopBar({
  canPost,
  isReply,
  isPublishQueued,
  isPublishing,
  isThread,
  publishingStage,
  onCancel,
  onPublish,
  topBarAnimatedStyle,
  children,
}: {
  isPublishing: boolean
  publishingStage: string
  canPost: boolean
  isReply: boolean
  isPublishQueued: boolean
  isThread: boolean
  onCancel: () => void
  onPublish: () => void
  topBarAnimatedStyle: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  return (
    <Animated.View
      style={topBarAnimatedStyle}
      layout={native(LinearTransition)}>
      <View style={styles.topbarInner}>
        <Button
          label={`Cancel`}
          variant="ghost"
          size="default"
          style={[a.rounded_full, a.py_sm, {paddingLeft: 7, paddingRight: 7}]}
          onPress={onCancel}
          textStyle={a.text_md}
          >
            Cancel
        </Button>
        <View style={a.flex_1} />
        {isPublishing ? (
          <>
            <Text>{publishingStage}</Text>
            <View style={styles.postBtn}>
              <ActivityIndicator />
            </View>
          </>
        ) : (
          <Button
            testID="composerPublishBtn"
            label={
              isReply
                ? isThread
                  ? 'Publish replies'
                  : 'Publish reply'
                : isThread
                  ? 'Publish posts'
                  : 'Publish post'
            }
            variant="default"
            size="default"
            style={[a.rounded_full, a.py_sm]}
            onPress={onPublish}
            disabled={!canPost || isPublishQueued}
            textStyle={a.text_md}
            >
                {isReply ? (
                  <Text>Reply</Text>
                ) : isThread ? (
                  <Text>Post All</Text>
                ) : (
                  <Text>Post</Text>
                )}
          </Button>
        )}
      </View>
      {children}
    </Animated.View>
  )
}

function ErrorBanner({
  error: standardError,
  videoState,
  clearError,
  clearVideo,
}: {
  error: string
  videoState: VideoState | NoVideoState
  clearError: () => void
  clearVideo: () => void
}) {

  const videoError =
    videoState.status === 'error' ? videoState.error : undefined
  const error = standardError || videoError

  const onClearError = () => {
    if (standardError) {
      clearError()
    } else {
      clearVideo()
    }
  }

  if (!error) return null

  return (
    <Animated.View
      style={[a.px_lg, a.py_sm]}
      entering={FadeIn}
      exiting={FadeOut}>
      <View
        style={[
          a.px_md,
          a.py_sm,
          a.gap_xs,
          a.rounded_sm,
        ]}>
        <View style={[a.relative, a.flex_row, a.gap_sm, {paddingRight: 48}]}>
          <Icon family="MaterialCommunityIcons" name="alert" />
          <Text style={[a.flex_1, a.leading_snug, {paddingTop: 1}]}>
            {error}
          </Text>
          <Button
            icon={{ family: 'MaterialCommunityIcons', name: 'x' }}
            label={`Dismiss error`}
            variant="ghost"
            style={[a.absolute, {top: 0, right: 0}]}
            onPress={onClearError}>
          </Button>
        </View>
      </View>
    </Animated.View>
  )
}