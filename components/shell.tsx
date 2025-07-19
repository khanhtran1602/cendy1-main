import TabsLayout from '@/app/(tabs)/_layout'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useDedupe } from '@/lib/hooks/useDedupe'
import { useNavigation } from '@react-navigation/native'
import { requireNativeModule } from 'expo-modules-core'
import { Component, ReactNode, useEffect, useState } from 'react'
import { StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { Gesture } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isAndroid } from '../platform/detection'

interface Props {
    children?: ReactNode
    renderError?: (error: any) => ReactNode
    style?: StyleProp<ViewStyle>
  }
interface State {
    hasError: boolean
    error: any
  }

const useTheme = () => {
    const theme = useThemeColor({}, 'text')
    return theme
}
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
      hasError: false,
      error: undefined,
    }
}

function ShellInner() {
  const t = useTheme()

  const winDim = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const NativeModule = requireNativeModule('ExpoBlueskyVisibilityView')
  const updateActiveViewAsync = async () => {
    await NativeModule.updateActiveViewAsync()
  }
  // HACK
  // expo-video doesn't like it when you try and move a `player` to another `VideoView`. Instead, we need to actually
  // unregister that player to let the new screen register it. This is only a problem on Android, so we only need to
  // apply it there.
  // The `state` event should only fire whenever we push or pop to a screen, and should not fire consecutively quickly.
  // To be certain though, we will also dedupe these calls.
  const navigation = useNavigation()
  const dedupe = useDedupe(1000)
  useEffect(() => {
    if (!isAndroid) return
    const onFocusOrBlur = () => {
      setTimeout(() => {
        dedupe(updateActiveViewAsync)
      }, 500)
    }
    navigation.addListener('state', onFocusOrBlur)
    return () => {
      navigation.removeListener('state', onFocusOrBlur)
    }
  }, [dedupe, navigation])


  const [trendingScrollGesture] = useState(() => Gesture.Native())
  return (
    <>
      <View style={{height: '100%'}}>
        <TabsLayout />
      </View>
    </>
  )
}

export const Shell: React.FC = function ShellImpl() {
  const t = useTheme()

  useEffect(() => {
  }, [t])

  return (
    <View testID="mobileShellView" style={[{height: '100%'}]}>
      <SystemBars
        style={{
          statusBar:
            'light',
          navigationBar: 'light',
        }}
      />
      <RoutesContainer>
        <ShellInner />
      </RoutesContainer>
    </View>
  )
}