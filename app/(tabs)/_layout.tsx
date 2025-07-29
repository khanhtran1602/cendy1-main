import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`[${timestamp}] [TabsLayout] Rendering TabsLayout`);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: () => console.log(`[${timestamp}] [TabsLayout] Home tab pressed`),
        })}
      />
      <Tabs.Screen
        name="chats"
        options={{
          headerShown: false,
          tabBarBadge: 2,
          title: t('tabs.chats'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: () => console.log(`[${timestamp}] [TabsLayout] Chats tab pressed`),
        })}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: () => console.log(`[${timestamp}] [TabsLayout] Settings tab pressed`),
        })}
      />
    </Tabs>
  );
}