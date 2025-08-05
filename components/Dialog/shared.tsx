import type React from 'react'
import {
    type LayoutChangeEvent,
    type StyleProp,
    type TextStyle,
    View,
    type ViewStyle,
} from 'react-native'
  
  import { atoms as a } from '@/alf/atoms'
import { Text } from '@/components/ui/text'
  
  export function Header({
    renderLeft,
    renderRight,
    children,
    style,
    onLayout,
  }: {
    renderLeft?: () => React.ReactNode
    renderRight?: () => React.ReactNode
    children?: React.ReactNode
    style?: StyleProp<ViewStyle>
    onLayout?: (event: LayoutChangeEvent) => void
  }) {
    return (
      <View
        onLayout={onLayout}
        style={[
          a.relative,
          a.w_full,
          a.py_sm,
          a.flex_row,
          a.justify_center,
          a.align_center,
          {minHeight: 50},
          a.border_b,
          {borderTopLeftRadius: a.rounded_md.borderRadius},
          {borderTopRightRadius: a.rounded_md.borderRadius},
          style,
        ]}>
        {renderLeft && (
          <View style={[a.absolute, {left: 6}]}>{renderLeft()}</View>
        )}
        {children}
        {renderRight && (
          <View style={[a.absolute, {right: 6}]}>{renderRight()}</View>
        )}
      </View>
    )
  }
  
  export function HeaderText({
    children,
    style,
  }: {
    children?: React.ReactNode
    style?: StyleProp<TextStyle>
  }) {
    return (
      <Text style={[a.text_lg, a.text_center, a.font_bold, style]}>
        {children}
      </Text>
    )
  }