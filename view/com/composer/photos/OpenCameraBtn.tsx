import { Icon } from '@/components/ui/icon'
import { POST_IMG_MAX } from '@/lib/constants'
import { useCameraPermission } from '@/lib/hooks/usePermissions'
import { isNative } from '@/platform/detection'
import { type ComposerImage, createComposerImage } from '@/state/gallery'
import { type ImagePickerOptions, launchCameraAsync } from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { useCallback } from 'react'
import { TouchableOpacity } from 'react-native'

export async function openCamera(customOpts: ImagePickerOptions) {
    const opts: ImagePickerOptions = {
        mediaTypes: 'images',
        ...customOpts,
    }
    const res = await launchCameraAsync(opts)
  
    if (!res || !res.assets) {
        throw new Error('Camera was closed before taking a photo')
    }
  
    const asset = res?.assets[0]
  
    return {
        path: asset.uri,
        mime: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
    }
}

type Props = {
    disabled?: boolean
    onAdd: (next: ComposerImage[]) => void
    renderIcon?: () => React.ReactNode
    style?: any
    iconColor?: string
}

export function OpenCameraBtn({
    disabled, 
    onAdd, 
    renderIcon, 
    style,
    iconColor
}: Props) {
    const {requestCameraAccessIfNeeded} = useCameraPermission()
    const [mediaPermissionRes, requestMediaPermission] =
        MediaLibrary.usePermissions({granularPermissions: ['photo']})

    const onPressTakePicture = useCallback(async () => {
        try {
            if (!(await requestCameraAccessIfNeeded())) {
                return
            }
            if (!mediaPermissionRes?.granted && mediaPermissionRes?.canAskAgain) {
                await requestMediaPermission()
            }

            const img = await openCamera({
                aspect: [POST_IMG_MAX.width, POST_IMG_MAX.height],
            })

            if (mediaPermissionRes) {
                await MediaLibrary.createAssetAsync(img.path)
            }

            const res = await createComposerImage(img)

            onAdd([res])
        } catch (err: any) {
            // Handle error silently
        }
    }, [
        onAdd,
        requestCameraAccessIfNeeded,
        mediaPermissionRes,
        requestMediaPermission,
    ])

    const shouldShowCameraButton = isNative
    if (!shouldShowCameraButton) {
        return null
    }

    return (
        <TouchableOpacity
            onPress={onPressTakePicture}
            disabled={disabled}
            style={style}
        >
            {renderIcon ? renderIcon() : (
                <Icon
                    family="Ionicons"
                    name="camera-outline"
                    size={22}
                    color={iconColor}
                />
            )}
        </TouchableOpacity>
    )
}