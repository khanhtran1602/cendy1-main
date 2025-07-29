import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function HomeLayout() {
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  console.log(`[${timestamp}] [HomeLayout] Rendering home layout`);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: t('tabs.home'),
        }}
      />
    </Stack>
  );
}