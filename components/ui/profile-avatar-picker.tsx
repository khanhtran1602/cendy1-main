import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { MediaAsset, MediaPicker } from '@/components/ui/media-picker';
import { Pressable, StyleSheet } from 'react-native';

type ProfileAvatarPickerProps = {
  selectedPhoto: MediaAsset | null;
  onSelectionChange: (assets: MediaAsset[]) => void;
  onError: (error: string) => void;
  size?: number;
};

export function ProfileAvatarPicker({ selectedPhoto, onSelectionChange, onError, size = 80 }: ProfileAvatarPickerProps) {
  return (
    <MediaPicker
      mediaType="image"
      multiple={false}
      gallery={true}
      showPreview={false}
      onSelectionChange={onSelectionChange}
      onError={onError}
    >
      <Pressable style={styles.container}>
        <Avatar size={size}>
          {selectedPhoto ? (
            <AvatarImage source={{ uri: selectedPhoto.uri }} />
          ) : (
            <AvatarFallback>
              <Icon family="MaterialCommunityIcons" name="camera" size={32} />
            </AvatarFallback>
          )}
        </Avatar>
      </Pressable>
    </MediaPicker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});