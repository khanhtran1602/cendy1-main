import { atoms as a } from '@/alf/atoms'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { CenteredView } from '@/view/com/util/Views'
import { Logo } from '@/view/icons/Logo'
import React, { Component, ReactNode } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  children?: ReactNode
  renderError?: (error: any) => ReactNode
  style?: StyleProp<ViewStyle>
}

interface State {
  hasError: boolean
  error: any
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  }

  static getDerivedStateFromError(error: any) {
    return {hasError: true, error}
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    const {hasError, error} = this.state
    if (hasError) {
      return this.props.renderError ? this.props.renderError(error) : null
    }

    return this.props.children
  }
}

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const insets = useSafeAreaInsets()

  return (
    <CenteredView style={[a.h_full, a.flex_1]}>
      <ErrorBoundary>
        <View style={[{flex: 1}, a.justify_center, a.align_center]}>
          <Logo width={92} fill="sky" />

          <View style={[a.pb_sm, a.pt_5xl]}>
            <Logo width={161} />
          </View>

          <Text style={[a.text_md, a.font_bold]}>
            What's up?
          </Text>
        </View>

        <View
          testID="signinOrCreateAccount"
          style={[a.px_xl, a.gap_md, a.pb_2xl]}>
          <Button
            testID="createAccountButton"
            onPress={onPressCreateAccount}
            label="Create new account"
            accessibilityHint="Opens flow to create a new Bluesky account"
            size="lg"
            variant="default">
            Create account
          </Button>
          <Button
            testID="signInButton"
            onPress={onPressSignin}
            label="Sign in"
            accessibilityHint="Opens flow to sign in to your existing Bluesky account"
            size="lg"
            variant="default">
            Sign in
          </Button>
        </View>

        <View
          style={[
            a.px_lg,
            a.pt_md,
            a.pb_2xl,
            a.justify_center,
            a.align_center,
          ]}>
          <View />
        </View>

        <View style={{height: insets.bottom}} />
      </ErrorBoundary>
    </CenteredView>
  )
}
