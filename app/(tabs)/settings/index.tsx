import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Persist language selection
  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('appLanguage', lang);
      setCurrentLanguage(lang);
    } catch (err) {
      Alert.alert(t('error.title'), t('error.changeLanguage'));
    }
  };

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && i18n.language !== savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage);
      }
    };
    loadLanguage();
  }, [i18n]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.buttonContainer}>
        <Button
          title={t('settings.english')}
          onPress={() => changeLanguage('en')}
          disabled={currentLanguage === 'en'}
        />
        <Button
          title={t('settings.vietnamese')}
          onPress={() => changeLanguage('vi')}
          disabled={currentLanguage === 'vi'}
        />
      </View>
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
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
});