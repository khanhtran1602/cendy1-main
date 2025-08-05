import {
    createContext,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
} from 'react'
  
  import { BottomSheetSnapPoint } from '@/components/bottom-sheet/src/BottomSheet.types'
import {
    type DialogContextProps,
    type DialogControlRefProps,
    type DialogOuterProps,
} from '@/components/Dialog/types'
import { useDialogStateContext } from '@/state/dialogs'
  
  export const Context = createContext<DialogContextProps>({
    close: () => {},
    isNativeDialog: false,
    nativeSnapPoint: BottomSheetSnapPoint.Hidden,
    disableDrag: false,
    setDisableDrag: () => {},
    isWithinDialog: false,
  })
  
  export function useDialogContext() {
    return useContext(Context)
  }
  
  export function useDialogControl(): DialogOuterProps['control'] {
    const id = useId()
    const control = useRef<DialogControlRefProps>({
      open: () => {},
      close: () => {},
    })
    const {activeDialogs} = useDialogStateContext()
  
    useEffect(() => {
      activeDialogs.current.set(id, control)
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        activeDialogs.current.delete(id)
      }
    }, [id, activeDialogs])
  
    return useMemo<DialogOuterProps['control']>(
      () => ({
        id,
        ref: control,
        open: () => {
          control.current.open()
        },
        close: cb => {
          control.current.close(cb)
        },
      }),
      [id, control],
    )
  }