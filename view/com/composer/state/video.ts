import { AbortError } from '@/lib/async/cancelable';
import { compressVideo } from '@/lib/media/video/compress';
import { VideoTooLargeError } from '@/lib/media/video/errors';
import { type CompressedVideo } from '@/lib/media/video/types';
import { type I18n } from '@lingui/core';
import { type SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { type ImagePickerAsset } from 'expo-image-picker';

type CaptionsTrack = { lang: string; file: File };

export type VideoAction =
  | {
      type: 'compressing_to_uploading';
      video: CompressedVideo;
      signal: AbortSignal;
    }
  | { type: 'to_error'; error: string; signal: AbortSignal }
  | {
      type: 'to_done';
      filePath: string;
      fileUrl: string;
      signal: AbortSignal;
    }
  | { type: 'update_progress'; progress: number; signal: AbortSignal }
  | {
      type: 'update_alt_text';
      altText: string;
      signal: AbortSignal;
    }
  | {
      type: 'update_captions';
      updater: (prev: CaptionsTrack[]) => CaptionsTrack[];
      signal: AbortSignal;
    };

const noopController = new AbortController();
noopController.abort();

export const NO_VIDEO = Object.freeze({
  status: 'idle',
  progress: 0,
  abortController: noopController,
  asset: undefined,
  video: undefined,
  filePath: undefined,
  fileUrl: undefined,
  altText: '',
  captions: [],
});

export type NoVideoState = typeof NO_VIDEO;

type ErrorState = {
  status: 'error';
  progress: 100;
  abortController: AbortController;
  asset: ImagePickerAsset | null;
  video: CompressedVideo | null;
  filePath: string | null;
  fileUrl: string | null;
  error: string;
  altText: string;
  captions: CaptionsTrack[];
};

type CompressingState = {
  status: 'compressing';
  progress: number;
  abortController: AbortController;
  asset: ImagePickerAsset;
  video?: undefined;
  filePath?: undefined;
  fileUrl?: undefined;
  altText: string;
  captions: CaptionsTrack[];
};

type UploadingState = {
  status: 'uploading';
  progress: number;
  abortController: AbortController;
  asset: ImagePickerAsset;
  video: CompressedVideo;
  filePath?: undefined;
  fileUrl?: undefined;
  altText: string;
  captions: CaptionsTrack[];
};

type DoneState = {
  status: 'done';
  progress: 100;
  abortController: AbortController;
  asset: ImagePickerAsset;
  video: CompressedVideo;
  filePath: string;
  fileUrl: string;
  altText: string;
  captions: CaptionsTrack[];
};

export type VideoState = ErrorState | CompressingState | UploadingState | DoneState;

export function createVideoState(
  asset: ImagePickerAsset,
  abortController: AbortController,
): CompressingState {
  return {
    status: 'compressing',
    progress: 0,
    abortController,
    asset,
    altText: '',
    captions: [],
  };
}

export function videoReducer(state: VideoState, action: VideoAction): VideoState {
  if (action.signal.aborted || action.signal !== state.abortController.signal) {
    return state;
  }
  switch (action.type) {
    case 'to_error':
      return {
        status: 'error',
        progress: 100,
        abortController: state.abortController,
        error: action.error,
        asset: state.asset ?? null,
        video: state.video ?? null,
        filePath: state.filePath ?? null,
        fileUrl: state.fileUrl ?? null,
        altText: state.altText,
        captions: state.captions,
      };
    case 'update_progress':
      if (state.status === 'compressing' || state.status === 'uploading') {
        return { ...state, progress: action.progress };
      }
      break;
    case 'update_captions':
      return { ...state, captions: action.updater(state.captions) };
    case 'compressing_to_uploading':
      if (state.status === 'compressing') {
        return {
          status: 'uploading',
          progress: 0,
          abortController: state.abortController,
          asset: state.asset,
          video: action.video,
          altText: state.altText,
          captions: state.captions,
        };
      }
      break;
    case 'to_done':
      if (state.status === 'uploading') {
        return {
          status: 'done',
          progress: 100,
          abortController: state.abortController,
          asset: state.asset,
          video: state.video,
          filePath: action.filePath,
          fileUrl: action.fileUrl,
          altText: state.altText,
          captions: state.captions,
        };
      }
      break;
    default:
  }
  return state;
}

function trunc2dp(num: number) {
  return Math.trunc(num * 100) / 100;
}

// Helper function to upload using FormData (React Native preferred method)
async function uploadWithFormData(
  video: CompressedVideo,
  fileName: string,
  supabase: SupabaseClient,
) {
  const formData = new FormData();
  
  formData.append('file', {
    uri: video.uri,
    type: video.mimeType,
    name: fileName,
  } as any);

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, formData, {
      contentType: video.mimeType,
    });

  return { data, error };
}

// Helper function to upload using base64 (fallback method)
async function uploadWithBase64(
  video: CompressedVideo,
  fileName: string,
  supabase: SupabaseClient,
) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(video.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 to Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, bytes, {
      contentType: video.mimeType,
    });

  return { data, error };
}

// Main video processing function for React Native
export async function processVideo(
  asset: ImagePickerAsset,
  dispatch: (action: VideoAction) => void,
  supabase: SupabaseClient,
  userId: string,
  signal: AbortSignal,
  _: I18n['_'],

) {
  let video: CompressedVideo | undefined;
  try {
    video = await compressVideo(asset, {
      onProgress: num => {
        dispatch({ type: 'update_progress', progress: trunc2dp(num), signal });
      },
      signal,
    });
  } catch (e) {
    const message = getCompressErrorMessage(e);
    if (message !== null) {
      dispatch({ type: 'to_error', error: message, signal });
    }
    return;
  }
  dispatch({ type: 'compressing_to_uploading', video, signal });

  try {
    const fileName = `${userId}/${Date.now()}-${asset.fileName || 'video.mp4'}`;
    
    // Try FormData first, fallback to base64 if needed
    let uploadResult;
    try {
      uploadResult = await uploadWithFormData(video, fileName, supabase);
    } catch (formDataError) {
      console.warn('FormData upload failed, trying base64:', formDataError);
      uploadResult = await uploadWithBase64(video, fileName, supabase);
    }

    const { data, error } = uploadResult;

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to retrieve public URL');
    }

    dispatch({
      type: 'to_done',
      filePath: data!.path,
      fileUrl: publicUrlData.publicUrl,
      signal,
    });
  } catch (e) {
    const message = getUploadErrorMessage(e);
    if (message !== null) {
      dispatch({ type: 'to_error', error: message, signal });
    }
    console.error('Error uploading video to Supabase', { safeMessage: e });
  }
}

function getCompressErrorMessage(e: unknown): string | null {
  if (e instanceof AbortError) {
    return null;
  }
  if (e instanceof VideoTooLargeError) {
    return `The selected video is larger than 100 MB. Please try again with a smaller file.`;
  }
  console.error('Error compressing video', { safeMessage: e });
  return `An error occurred while compressing the video.`;
}

function getUploadErrorMessage(e: unknown): string | null {
  if (e instanceof AbortError) {
    return null;
  }
  if (e instanceof Error) {
    switch (e.message) {
      case 'The resource already exists':
        return `A file with this name already exists. Please try again with a different file.`;
      case 'The user does not have permission to perform this action':
        return `You are not authorized to upload videos.`;
      case 'The uploaded file is too large':
        return `The selected video is larger than the allowed size. Please try a smaller file.`;
      default:
        return `An error occurred while uploading the video: ${e.message}`;
    }
  }
  console.error('Unknown error during video upload', { safeMessage: e });
  return `An error occurred while uploading the video.`;
}