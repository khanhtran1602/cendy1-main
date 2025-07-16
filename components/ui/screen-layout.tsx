import { ScrollView } from '@/components/ui/scroll-view';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ReactNode, useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView as RNScrollView, SafeAreaView, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ScreenLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
  containerStyle?: any;
}

export const ScreenLayout = ({ children, scrollable = true, containerStyle }: ScreenLayoutProps) => {
  const backgroundColor = useThemeColor({}, 'background');
  const scrollViewRef = useRef<RNScrollView>(null);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      const keyboardHeight = event.endCoordinates.height;
      // Animate content up by the keyboard height
      translateY.value = withTiming(-keyboardHeight * 0.5, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    };

    const keyboardWillHide = () => {
      // Animate content back to original position
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    };

    // Use 'keyboardWillShow'/'keyboardWillHide' for iOS, 'keyboardDidShow'/'keyboardDidHide' for Android
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, keyboardWillShow);
    const keyboardHideListener = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
        {scrollable ? (
          <ScrollView
            ref={scrollViewRef}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contentContainer}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 40, // Increased for extra space
    flexGrow: 1,
    justifyContent: 'center',
  },
});