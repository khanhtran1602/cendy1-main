import { useThemeColor } from '@/hooks/useThemeColor';
import {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
} from '@expo/vector-icons';
import React from 'react';

// Define available icon families
export type IconFamily = 
  | 'AntDesign'
  | 'Entypo'
  | 'EvilIcons'
  | 'Feather'
  | 'FontAwesome'
  | 'FontAwesome5'
  | 'Fontisto'
  | 'Foundation'
  | 'Ionicons'
  | 'MaterialCommunityIcons'
  | 'MaterialIcons'
  | 'Octicons'
  | 'SimpleLineIcons'
  | 'Zocial';

// Map icon families to their components
const iconComponents = {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
} as const;

export type IconProps = {
  family: IconFamily;
  name: string;
  size?: number;
  color?: string;
  lightColor?: string;
  darkColor?: string;
  style?: any;
};

export function Icon({
  family,
  name,
  size = 24,
  color,
  lightColor,
  darkColor,
  style,
  ...rest
}: IconProps) {
  const themedColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'icon'
  );

  // Use provided color prop if available, otherwise use themed color
  const iconColor = color || themedColor;

  // Get the appropriate icon component
  const IconComponent = iconComponents[family];

  return (
    <IconComponent
      name={name as any}
      size={size}
      color={iconColor}
      style={style}
      {...rest}
    />
  );
}