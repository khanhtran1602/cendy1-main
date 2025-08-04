// @/lib/media/video/compress.ts
import { ImagePickerAsset } from 'expo-image-picker'
import { getVideoMetaData, Video } from 'react-native-compressor'

import { SUPPORTED_MIME_TYPES, SupportedMimeTypes } from '@/lib/constants'
import { CompressedVideo } from '@/lib/media/video/types'
import { extToMime } from '@/lib/media/video/util'

const MIN_SIZE_FOR_COMPRESSION = 25 // 25mb

export async function compressVideo(
  file: ImagePickerAsset,
  opts?: {
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<CompressedVideo> {
  const {onProgress, signal} = opts || {}

  const isAcceptableFormat = SUPPORTED_MIME_TYPES.includes(
    file.mimeType as SupportedMimeTypes,
  )

  const minimumFileSizeForCompress = isAcceptableFormat
    ? MIN_SIZE_FOR_COMPRESSION
    : 0

  const compressed = await Video.compress(
    file.uri,
    {
      compressionMethod: 'manual',
      bitrate: 3_000_000, // 3mbps
      maxSize: 1920,
      // WARNING: this ONE SPECIFIC ARG is in MB -sfn
      minimumFileSizeForCompress,
      getCancellationId: (id: string) => {
        if (signal) {
          signal.addEventListener('abort', () => {
            Video.cancelCompression(id)
          })
        }
      },
    },
    onProgress,
  )

  const info = await getVideoMetaData(compressed)

  return {
    uri: compressed, 
    size: info.size, 
    mimeType: extToMime(info.extension)
  }
}