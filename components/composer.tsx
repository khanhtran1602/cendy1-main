import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useThemeColor } from '@/hooks/useThemeColor';
import { useUserStore } from '@/stores/userStore';
import { BORDER_RADIUS, FONT_SIZE } from '@/theme/globals';
import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface ComposerProps {
  onCancel?: () => void;
  onPost?: (content: string, topic?: string, channel?: string) => void;
  onMediaSelect?: (type: 'camera' | 'photo' | 'microphone') => void;
}

// Predefined topics list
const PREDEFINED_TOPICS = [
  'Technology',
  'Sports',
  'Music',
  'Food',
  'Travel',
  'Art',
  'Fashion',
  'Gaming',
  'Health',
  'Education',
  'Business',
  'Entertainment',
  'Science',
  'Nature',
  'Photography',
];

// Fixed channels
const CHANNELS = [
  'Campus Talk',
  'Campus Crush', 
  'Nation Talk',
  'Nation Crush'
];

export const Composer: React.FC<ComposerProps> = ({
  onCancel,
  onPost,
  onMediaSelect,
}) => {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('Campus Talk'); // Default channel
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [replySettings, setReplySettings] = useState<'anyone' | 'followers' | 'mentioned'>('anyone');
  const textInputRef = useRef<TextInput>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'primary');
  const blueColor = useThemeColor({}, 'blue');
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

  const getReplySettingsText = () => {
    switch (replySettings) {
      case 'followers':
        return 'Followers can reply & quote';
      case 'mentioned':
        return 'Only mentioned can reply';
      default:
        return 'Anyone can reply & quote';
    }
  };

  const cycleReplySettings = () => {
    const settings: Array<'anyone' | 'followers' | 'mentioned'> = ['anyone', 'followers', 'mentioned'];
    const currentIndex = settings.indexOf(replySettings);
    const nextIndex = (currentIndex + 1) % settings.length;
    setReplySettings(settings[nextIndex]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={{ color: textColor, fontSize: FONT_SIZE }}>Cancel</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text variant="subtitle" style={{ color: textColor }}>
            New thread
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Empty space for balance */}
        </View>
      </View>

      {/* Main Content */}
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
                <Text variant="body" style={{ color: textColor, fontWeight: '600' }}>
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
                    <Text style={[styles.channelText, { color: primaryColor }]}>
                      {channel}
                    </Text>
                  </ComboboxTrigger>
                  <ComboboxContent>
                    <ComboboxInput placeholder="Search channels..." />
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
            maxLength={500}
          />

          {/* Media and Actions Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity
                onPress={() => onMediaSelect?.('camera')}
                style={styles.mediaButton}
              >
                <Icon
                  family="Ionicons"
                  name="camera-outline"
                  size={22}
                  color={mutedColor}
                />
              </TouchableOpacity>
              
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

            {/* Character Count */}
            <Text style={[styles.characterCount, { color: mutedColor }]}>
              {content.length}/500
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: borderColor }]}>
        <TouchableOpacity onPress={cycleReplySettings} style={styles.replySettings}>
          <Icon
            family="Ionicons"
            name="globe-outline"
            size={16}
            color={mutedColor}
          />
          <Text style={[styles.replySettingsText, { color: mutedColor }]}>
            {getReplySettingsText()}
          </Text>
          <Icon
            family="Ionicons"
            name="chevron-down"
            size={16}
            color={mutedColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          style={[
            styles.postButton,
            {
              backgroundColor: canPost ? blueColor : cardColor,
              opacity: canPost ? 1 : 0.5,
            },
          ]}
          disabled={!canPost}
        >
          <Text
            style={[
              styles.postButtonText,
              { color: canPost ? 'white' : mutedColor },
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60, // Ensure consistent width
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 60, // Match headerButton width for perfect centering
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
    alignItems: 'center',
    marginRight: 12,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column',
    marginTop: -4,
  },
  userInfoSection: {
    marginBottom: 4, // Space between user info and topic
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
    fontSize: FONT_SIZE,
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
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    marginRight: 20,
    padding: 4,
  },
  characterCount: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replySettings: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  replySettingsText: {
    fontSize: FONT_SIZE,
    marginHorizontal: 8,
  },
  postButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: FONT_SIZE,
    fontWeight: '600',
  },
  // Topic Selector Modal Styles
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
});