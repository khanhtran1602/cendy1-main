import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View as CustomView } from '@/components/ui/view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HEIGHT } from '@/theme/globals';
import { useNavigation, useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext } from 'react';
import { Dimensions, Platform, type Insets } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define hitSlop for buttons
const createHitSlop = (size: number): Insets => ({
  top: size,
  bottom: size,
  left: size,
  right: size,
});
const HITSLOP_30 = createHitSlop(30);

// Responsive constants
const HEADER_SLOT_SIZE = 44; // Increased for better touch targets
const MIN_HEADER_HEIGHT = 56;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isIOS = Platform.OS === 'ios';

// Context for alignment
const AlignmentContext = createContext<'platform' | 'left'>('platform');

// Sheet (Drawer) context for MenuButton
const SheetContext = createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

export function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

export interface OuterProps {
  children: React.ReactNode;
  noBottomBorder?: boolean;
  sticky?: boolean;
  transparent?: boolean;
  elevated?: boolean;
}

export function Outer({
  children,
  noBottomBorder = false,
  sticky = false, // Changed default to false
  transparent = false,
  elevated = true,
}: OuterProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const insets = useSafeAreaInsets();
  
  // Calculate proper header height
  const headerHeight = Math.max(MIN_HEADER_HEIGHT, HEIGHT || MIN_HEADER_HEIGHT);
  const totalHeight = headerHeight + (sticky ? insets.top : 0);

  return (
    <CustomView
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: headerHeight,
          backgroundColor: transparent ? 'transparent' : backgroundColor,
          paddingTop: sticky ? insets.top + 12 : 12,
          ...(sticky && {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }),
          ...(!noBottomBorder && !transparent && {
            borderBottomColor: borderColor,
          }),
          ...(elevated && !transparent && {
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: 4,
              },
            }),
          }),
        },
      ]}
    >
      {children}
    </CustomView>
  );
}

export interface ContentProps {
  children?: React.ReactNode;
  align?: 'platform' | 'left';
}

export function Content({ children, align = 'platform' }: ContentProps) {
  return (
    <CustomView
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          minHeight: HEADER_SLOT_SIZE,
          paddingHorizontal: 8, // Add breathing room
        },
        isIOS && align === 'platform' && { alignItems: 'center' },
        !isIOS && align === 'platform' && { alignItems: 'flex-start' },
      ]}
    >
      <AlignmentContext.Provider value={align}>{children}</AlignmentContext.Provider>
    </CustomView>
  );
}

export interface SlotProps {
  children?: React.ReactNode;
  side?: 'left' | 'right';
}

export function Slot({ children, side = 'left' }: SlotProps) {
  return (
    <CustomView 
      style={{ 
        width: HEADER_SLOT_SIZE,
        height: HEADER_SLOT_SIZE,
        justifyContent: 'center',
        alignItems: side === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      {children}
    </CustomView>
  );
}

export interface BackButtonProps {
  onPress?: () => void;
  color?: string;
}

export function BackButton({ onPress, color }: BackButtonProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const iconColor = color || useThemeColor({}, 'text');

  const onPressBack = useCallback(() => {
    if (onPress) {
      onPress();
    }
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  }, [onPress, router, navigation]);

  return (
    <Slot side="left">
      <Button
        variant="ghost"
        size="icon"
        onPress={onPressBack}
        haptic
        icon={{ 
          family: 'MaterialCommunityIcons', 
          name: isIOS ? 'chevron-left' : 'arrow-left',

        }}
        style={{ 
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
        hitSlop={HITSLOP_30}
      />
    </Slot>
  );
}

export interface MenuButtonProps {
  sheetContext: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
  color?: string;
}

export function MenuButton({ sheetContext, color }: MenuButtonProps) {
  const iconColor = color || useThemeColor({}, 'text');
  
  const onPress = useCallback(() => {
    sheetContext.onOpenChange(true);
  }, [sheetContext]);

  return (
    <SheetContext.Provider value={sheetContext}>
      <Slot side="left">
        <Button
          variant="ghost"
          size="icon"
          onPress={onPress}
          haptic
          icon={{ 
            family: 'MaterialCommunityIcons', 
            name: 'menu',

          }}
          style={{ 
            width: 40,
            height: 40,
            borderRadius: 20,
          }}
          hitSlop={HITSLOP_30}
        />
      </Slot>
    </SheetContext.Provider>
  );
}

export interface ActionButtonProps {
  onPress: () => void;
  icon: string;
  color?: string;
  disabled?: boolean;
}

export function ActionButton({ onPress, icon, color, disabled = false }: ActionButtonProps) {
  const iconColor = color || useThemeColor({}, 'text');
  
  return (
    <Slot side="right">
      <Button
        variant="ghost"
        size="icon"
        onPress={onPress}
        haptic
        disabled={disabled}
        icon={{ 
          family: 'MaterialCommunityIcons', 
          name: icon,
        }}
        style={{ 
          width: 40,
          height: 40,
          borderRadius: 20,
          opacity: disabled ? 0.5 : 1,
        }}
        hitSlop={HITSLOP_30}
      />
    </Slot>
  );
}

export interface TitleTextProps {
  children: React.ReactNode;
}

export function TitleText({ children }: TitleTextProps) {
  const align = useContext(AlignmentContext);

  return (
    <Text
      variant="title"
      style={[
        {
          fontSize: 18,
          fontWeight: '600',
          letterSpacing: -0.5,
        },
        isIOS && align === 'platform' && { textAlign: 'center' },
        !isIOS && align === 'platform' && { textAlign: 'left' },
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {children}
    </Text>
  );
}

export interface SubtitleTextProps {
  children: React.ReactNode;
}

export function SubtitleText({ children }: SubtitleTextProps) {
  const align = useContext(AlignmentContext);
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <Text
      variant="caption"
      style={[
        { 
          color: mutedColor,
          fontSize: 14,
          marginTop: 2,
        },
        isIOS && align === 'platform' && { textAlign: 'center' },
        !isIOS && align === 'platform' && { textAlign: 'left' },
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {children}
    </Text>
  );
}

// New component for better layout control
export interface HeaderGroupProps {
  children: React.ReactNode;
  spacing?: number;
}

export function HeaderGroup({ children, spacing = 8 }: HeaderGroupProps) {
  return (
    <CustomView
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        gap: spacing,
      }}
    >
      {children}
    </CustomView>
  );
}

// Usage example component
export function ExampleUsage() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  
  return (
    <Outer elevated>
      <BackButton />
      <Content>
        <HeaderGroup>
          <TitleText>Screen Title</TitleText>
          <SubtitleText>Optional subtitle</SubtitleText>
        </HeaderGroup>
      </Content>
      <ActionButton 
        icon="share" 
        onPress={() => console.log('Share pressed')} 
      />
    </Outer>
  );
}