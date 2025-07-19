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
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SheetNavigation() {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const router = useRouter();

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
    // Navigate to corresponding screen
    if (itemId === 'home') {
      router.push('/(tabs)/home');
    } else if (itemId === 'profile') {
      router.push('/profile');
    } else if (itemId === 'messages') {
      router.push('/messages');
    } else if (itemId === 'search') {
      router.push('/search');
    } else if (itemId === 'notifications') {
      router.push('/notifications');
    } else if (itemId === 'settings') {
      router.push('/settings');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} side="left">
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          icon={{ family: 'Feather', name: 'menu' }}
          style={styles.headerButton}
        />
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
                    backgroundColor: isActive ? `${textColor}10` : 'transparent',
                    borderColor,
                  },
                ]}
                onPress={() => handleItemPress(item.id)}
              >
                <Icon
                  family='MaterialCommunityIcons'
                  name={item.icon.name}
                  size={24}
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
        </View>
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
    headerButton: {
      marginHorizontal: 10,
      marginLeft: 0,
      marginRight: 0,
    },
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