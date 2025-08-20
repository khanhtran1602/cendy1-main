import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { t } from 'i18next';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const { signOut } = useAuthStore();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const borderColor = useThemeColor({}, 'border');

  const navigationItems = [
    { id: 'home', label: 'Home', icon: { family: 'MaterialCommunityIcons', name: 'home' } },
    { id: 'profile', label: 'Profile', icon: { family: 'MaterialCommunityIcons', name: 'account' } },
    { id: 'messages', label: 'Messages', icon: { family: 'MaterialCommunityIcons', name: 'email' } },
    { id: 'search', label: 'Search', icon: { family: 'MaterialCommunityIcons', name: 'magnify' } },
    { id: 'notifications', label: 'Notifications', icon: { family: 'MaterialCommunityIcons', name: 'bell' } },
    { id: 'settings', label: 'Settings', icon: { family: 'MaterialCommunityIcons', name: 'cog' } },
  ];

  const handleItemPress = (itemId: string) => {
    setActiveItem(itemId);
    setOpen(false);
  };

  const handleSignOut = async () => {
    console.log(`[${timestamp}] [SettingsScreen] Sign-out button pressed`);
    try {
      await signOut();
      console.log(`[${timestamp}] [SettingsScreen] Sign-out initiated, waiting for session state change`);
    } catch (err) {
      console.log(`[${timestamp}] [SettingsScreen] Sign-out error`, { error: (err as Error).message });
      Alert.alert(t('error.title'), t('error.signOut'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} side='left'>
      <SheetTrigger>
        <Button>Open Navigation</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            Navigate to different sections of the app.
          </SheetDescription>
        </SheetHeader>
        <View style={styles.navigationContainer}>
          {navigationItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navigationItem,
                  {
                    backgroundColor: isActive
                      ? `${textColor}10`
                      : 'transparent',
                    borderColor,
                  },
                ]}
                onPress={() => handleItemPress(item.id)}
              >
                <Icon
                  family='MaterialCommunityIcons'
                  name={item.icon.name}
                  size={20}
                  color={isActive ? textColor : mutedColor}
                />
                <Text
                  style={[
                    styles.navigationText,
                    { color: isActive ? textColor : mutedColor },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Button
            label={t('home.signOut')}
            onPress={() => {
              console.log(`[${timestamp}] [SettingsScreen] Sign-out button pressed`);
              handleSignOut();
            }}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  navigationContainer: {
    padding: 16,
    gap: 8,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navigationText: {
    fontSize: 16,
    fontWeight: '500',
  },
});