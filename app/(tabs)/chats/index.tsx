import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Button, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chats.title')}</Text>
      <Text>{t('chats.placeholder')}</Text>
      <Button title="Debug Persisted State" onPress={debugPersistedState} />
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
});