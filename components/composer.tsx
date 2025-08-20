import { atoms as a } from '@/alf/atoms';
import { native } from '@/alf/util/platform';
import * as Prompt from '@/components/Prompt';
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
import { useIsKeyboardVisible } from '@/lib/hooks/useIsKeyboardVisible';
import { useNonReactiveCallback } from '@/lib/hooks/useNonReactiveCallback';
import { supabase } from '@/lib/supabase';
import { isAndroid, isIOS } from '@/platform/detection';
import { useDialogStateControlContext } from '@/state/dialogs';
import { useModalControls } from '@/state/modals';
import { type ComposerOpts, type OnPostSuccessData, useComposerControls } from '@/state/shell/composer';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { BORDER_RADIUS, FONT_SIZE } from '@/theme/globals';
import { OpenCameraBtn } from '@/view/com/composer/photos/OpenCameraBtn'; // Import the OpenCameraBtn component
import { composerReducer, createComposerState, PostAction, type PostDraft } from '@/view/com/composer/state/composer';
import { NoVideoState, processVideo, VideoState } from '@/view/com/composer/state/video';
import { TextInputRef } from '@/view/com/composer/text-input/TextInput';
import { clearThumbnailCache } from '@/view/com/composer/videos/VideoTranscodeBackdrop';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
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
  text: initText,
  imageUris: initImageUris,
  videoUri: initVideoUri,
  cancelRef,
}: Props & { cancelRef?: React.RefObject<CancelRef> }) => {
  const {session} = useAuthStore()
  const queryClient = useQueryClient()
  const currentid = session!.user.id
  const {closeComposer} = useComposerControls()
  const textInput = useRef<TextInputRef>(null)
  const discardPromptControl = Prompt.usePromptControl()

  const {closeAllDialogs} = useDialogStateControlContext()
  const {closeAllModals} = useModalControls()

  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingStage, setPublishingStage] = useState('')
  const [error, setError] = useState('')

  const [composerState, composerDispatch] = useReducer(
    composerReducer,
    {
      initImageUris,
      initText,
    },
    createComposerState,
  )
  const post = composerState.post
  const dispatch = useCallback(
    (postAction: PostAction) => {
      composerDispatch({
        type: 'update_post',
        postAction,
      })
    },
    [],
  )
  const selectVideo = React.useCallback(
    (asset: ImagePickerAsset) => {
      const abortController = new AbortController()
      composerDispatch({
        type: 'update_post',
        postAction: {
          type: 'embed_add_video',
          asset,
          abortController,
        },
      })
      processVideo(
        asset,
        videoAction => {
          composerDispatch({
            type: 'update_post',
            postAction: {
              type: 'embed_update_video',
              videoAction,
            },
          })
        },
        supabase,
        currentid,
        abortController.signal,
      )
    },
    [supabase, currentid, composerDispatch],
  )

  const onInitVideo = useNonReactiveCallback(() => {
    if (initVideoUri) {
      selectVideo(initVideoUri)
    }
  })

  useEffect(() => {
    onInitVideo()
  }, [onInitVideo])

  const clearVideo = React.useCallback(
    () => {
      composerDispatch({
        type: 'update_post',
        postAction: {
          type: 'embed_remove_video',
        },
      })
    },
    [composerDispatch],
  )

  const [publishOnUpload, setPublishOnUpload] = useState(false)

  const onClose = useCallback(() => {
    closeComposer()
    clearThumbnailCache(queryClient)
  }, [closeComposer, queryClient])

  const insets = useSafeAreaInsets()
  const viewStyles = useMemo(
    () => ({
      paddingTop: isAndroid ? insets.top : 0,
      paddingBottom:
        // iOS - when keyboard is closed, keep the bottom bar in the safe area
        (isIOS && !isKeyboardVisible) ||
        // Android - Android >=35 KeyboardAvoidingView adds double padding when
        // keyboard is closed, so we subtract that in the offset and add it back
        // here when the keyboard is open
        (isAndroid && isKeyboardVisible)
          ? insets.bottom
          : 0,
    }),
    [insets, isKeyboardVisible],
  )

  const onPressCancel = useCallback(() => {
    if (
      post.shortenedGraphemeLength > 0 ||
      post.embed.media ||
      post.embed.link
    ) {
      closeAllDialogs()
      Keyboard.dismiss()
      discardPromptControl.open()
    } else {
      onClose()
    }
  }, [post, closeAllDialogs, discardPromptControl, onClose])

  useImperativeHandle(cancelRef, () => ({onPressCancel}))

  // On Android, pressing Back should ask confirmation.
  useEffect(() => {
    if (!isAndroid) {
      return
    }
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (closeAllDialogs() || closeAllModals()) {
          return true
        }
        onPressCancel()
        return true
      },
    )
    return () => {
      backHandler.remove()
    }
  }, [onPressCancel, closeAllDialogs, closeAllModals])

  const canPost =
    post.shortenedGraphemeLength <= 500 &&
    !isEmptyPost(post) &&
    !(
          post.embed.media?.type === 'video' &&
          post.embed.media.video.status === 'error'
        )

  const onPressPublish = React.useCallback(async () => {
    if (isPublishing) {
      return
    }

    if (!canPost) {
      return
    }

    if (
      composerState.post.embed.media?.type === 'video' &&
      composerState.post.embed.media.video.asset &&
      composerState.post.embed.media.video.status !== 'done'
    ) {
      setPublishOnUpload(true)
      return
    }

    setError('')
    setIsPublishing(true)

    let postUri: string | undefined
    let postSuccessData: OnPostSuccessData
    try {
      console.log(`composer: posting...`)
      postUri = (
        await apilib.post(agent, queryClient, {
          thread,
          replyTo: replyTo?.uri,
          onStateChange: setPublishingStage,
          langs: toPostLanguages(langPrefs.postLanguage),
        })
      ).uris[0]

      /*
       * Wait for app view to have received the post(s). If this fails, it's
       * ok, because the post _was_ actually published above.
       */
      try {
        if (postUri) {
          console.log(`composer: waiting for app view`)

          const posts = await retry(
            5,
            _e => true,
            async () => {
              const res = await agent.app.bsky.unspecced.getPostThreadV2({
                anchor: postUri!,
                above: false,
                below: thread.posts.length - 1,
                branchingFactor: 1,
              })
              if (res.data.thread.length !== thread.posts.length) {
                throw new Error(`composer: app view is not ready`)
              }
              if (
                !res.data.thread.every(p =>
                  AppBskyUnspeccedDefs.isThreadItemPost(p.value),
                )
              ) {
                throw new Error(`composer: app view returned non-post items`)
              }
              return res.data.thread
            },
            1e3,
          )
          postSuccessData = {
            replyToUri: replyTo?.uri,
            posts,
          }
        }
      } catch (waitErr: any) {
        console.log(`composer: waiting for app view failed`, {
          safeMessage: waitErr,
        })
      }
    } catch (e: any) {
      console.log(e, {
        message: `Composer: create post failed`,
        hasImages: thread.posts.some(p => p.embed.media?.type === 'images'),
      })

      let err = cleanError(e.message)
      if (err.includes('not locate record')) {
        err = _(
          msg`We're sorry! The post you are replying to has been deleted.`,
        )
      } else if (e instanceof EmbeddingDisabledError) {
        err = _(msg`This post's author has disabled quote posts.`)
      }
      setError(err)
      setIsPublishing(false)
      return
    } finally {
      if (postUri) {
        let index = 0
        for (let post of thread.posts) {
          logEvent('post:create', {
            imageCount:
              post.embed.media?.type === 'images'
                ? post.embed.media.images.length
                : 0,
            isReply: index > 0 || !!replyTo,
            isPartOfThread: thread.posts.length > 1,
            hasLink: !!post.embed.link,
            hasQuote: !!post.embed.quote,
            langs: langPrefs.postLanguage,
            logContext: 'Composer',
          })
          index++
        }
      }
      if (thread.posts.length > 1) {
        logEvent('thread:create', {
          postCount: thread.posts.length,
          isReply: !!replyTo,
        })
      }
    }
    if (postUri && !replyTo) {
      emitPostCreated()
    }
    setLangPrefs.savePostLanguageToHistory()
    if (initQuote) {
      // We want to wait for the quote count to update before we call `onPost`, which will refetch data
      whenAppViewReady(agent, initQuote.uri, res => {
        const quotedThread = res.data.thread
        if (
          AppBskyFeedDefs.isThreadViewPost(quotedThread) &&
          quotedThread.post.quoteCount !== initQuote.quoteCount
        ) {
          onPost?.(postUri)
          onPostSuccess?.(postSuccessData)
          return true
        }
        return false
      })
    } else {
      onPost?.(postUri)
      onPostSuccess?.(postSuccessData)
    }
    onClose()
    Toast.show(
      thread.posts.length > 1
        ? _(msg`Your posts have been published`)
        : replyTo
          ? _(msg`Your reply has been published`)
          : _(msg`Your post has been published`),
    )
  }, [
    _,
    agent,
    thread,
    canPost,
    isPublishing,
    langPrefs.postLanguage,
    onClose,
    onPost,
    onPostSuccess,
    initQuote,
    replyTo,
    setLangPrefs,
    queryClient,
  ])



  
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


function isEmptyPost(post: PostDraft) {
  return (
    post.text.trim().length === 0 &&
    !post.embed.media &&
    !post.embed.link
  )
}

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