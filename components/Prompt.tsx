import React from 'react'
import { type GestureResponderEvent, StyleProp, View, ViewStyle } from 'react-native'

import { atoms as a } from '@/alf/atoms'
import { useBreakpoints } from '@/alf/breakpoints'
import * as Dialog from '@/components/Dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { type BottomSheetViewProps } from '@/modules/bottom-sheet'

export type ViewStyleProp = {
  style?: StyleProp<ViewStyle>
}
export {
  useDialogControl as usePromptControl, type DialogControlProps as PromptControlProps
} from '@/components/Dialog'

const Context = React.createContext<{
  titleId: string
  descriptionId: string
}>({
  titleId: '',
  descriptionId: '',
})

export function Outer({
  children,
  control,
  testID,
  nativeOptions,
}: React.PropsWithChildren<{
  control: Dialog.DialogControlProps
  testID?: string
  nativeOptions?: Omit<BottomSheetViewProps, 'children'>
}>) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  const context = React.useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  return (
    <Dialog.Outer
      control={control}
      testID={testID}
      webOptions={{alignCenter: true}}
      nativeOptions={{preventExpansion: true, ...nativeOptions}}>
      <Dialog.Handle />
      <Context.Provider value={context}>
        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}
          accessibilityDescribedBy={descriptionId}>
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function TitleText({
  children,
}: React.PropsWithChildren<ViewStyleProp>) {
  const {titleId} = React.useContext(Context)
  return (
    <Text
      nativeID={titleId}
      style={[
        a.flex_1,
        a.text_2xl,
        a.font_bold,
        a.pb_sm,
        a.leading_snug,
      ]}>
      {children}
    </Text>
  )
}

export function DescriptionText({
  children,
  selectable,
}: React.PropsWithChildren<{selectable?: boolean}>) {
  const {descriptionId} = React.useContext(Context)
  return (
    <Text
      nativeID={descriptionId}
      selectable={selectable}
      style={[a.text_md, a.leading_snug, a.pb_lg]}>
      {children}
    </Text>
  )
}

export function Actions({children}: React.PropsWithChildren<{}>) {
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        a.w_full,
        a.gap_md,
        a.justify_end,
        gtMobile
          ? [a.flex_row, a.flex_row_reverse, a.justify_start]
          : [a.flex_col],
      ]}>
      {children}
    </View>
  )
}

export function Cancel({
  cta,
}: {
  /**
   * Optional i18n string. If undefined, it will default to "Cancel".
   */
  cta?: string
}) {
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  const onPress = React.useCallback(() => {
    close()
  }, [close])

  return (
    <Button
      variant="secondary"
      size={gtMobile ? 'sm' : 'lg'}
      label={cta || 'Cancel'}
      onPress={onPress}>
      <>{cta || 'Cancel'}</>
    </Button>
  )
}

export function Action({
  onPress,
  cta,
  testID,
}: {
  /**
   * Callback to run when the action is pressed. The method is called _after_
   * the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onPress: (e: GestureResponderEvent) => void
  /**
   * Optional i18n string. If undefined, it will default to "Confirm".
   */
  cta?: string
  testID?: string
}) {
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  const handleOnPress = React.useCallback(() => {
    close(() => {
      const mockEvent = {} as GestureResponderEvent
      onPress?.(mockEvent)
    })
  }, [close, onPress])

  return (
    <Button
      variant="success"
      size={gtMobile ? 'sm' : 'lg'}
      label={cta || 'Confirm'}
      onPress={handleOnPress}
      testID={testID}>
      <>{cta || 'Confirm'}</>
    </Button>
  )
}

export function Basic({
  control,
  title,
  description,
  cancelButtonCta,
  confirmButtonCta,
  onConfirm,
  showCancel = true,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  title: string
  description?: string
  cancelButtonCta?: string
  confirmButtonCta?: string
  /**
   * Callback to run when the Confirm button is pressed. The method is called
   * _after_ the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onConfirm: (e: GestureResponderEvent) => void
  showCancel?: boolean
}>) {
  return (
    <Outer control={control} testID="confirmModal">
      <TitleText>{title}</TitleText>
      {description && <DescriptionText>{description}</DescriptionText>}
      <Actions>
        <Action
          cta={confirmButtonCta}
          onPress={onConfirm}
          testID="confirmBtn"
        />
        {showCancel && <Cancel cta={cancelButtonCta} />}
      </Actions>
    </Outer>
  )
}