import { MediaAsset, MediaPicker } from '@/components/ui/media-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export default function ChatsScreen() {
  const { t } = useTranslation();
  const debugPersistedState = async () => {
    try {
      const data = await AsyncStorage.getItem('user-settings-storage');
      console.log('Persisted State:', data ? JSON.parse(data) : 'No data found');
    } catch (err) {
      console.error('Error reading AsyncStorage:', err);
    }
  };
  const [selected, setSelected] = useState<MediaAsset[]>([]);

  return (
    <MediaPicker
      mediaType='all'
      gallery={true}
      multiple={true}
      maxSelection={4}
      icon={{ family: 'Ionicons', name: 'camera' }}
      variant='ghost'
      selectedAssets={selected}
      onSelectionChange={setSelected}
      previewSize={200}
    />
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
});