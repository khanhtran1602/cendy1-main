import { type ImagePickerAsset } from 'expo-image-picker'
import { nanoid } from 'nanoid/non-secure'

import { type ComposerImage, createInitialImages } from '@/state/gallery'
import { type ComposerOpts } from '@/state/shell/composer'
import {
  createVideoState,
  type VideoAction,
  videoReducer,
  type VideoState,
} from './video'

type ImagesMedia = {
  type: 'images'
  images: ComposerImage[]
}

type VideoMedia = {
  type: 'video'
  video: VideoState
}

type Link = {
  type: 'link'
  uri: string
}

export type EmbedDraft = {
  media: ImagesMedia | VideoMedia | undefined
  link: Link | undefined
}

export type PostDraft = {
  id: string
  text: string
  embed: EmbedDraft
  shortenedGraphemeLength: number
}

export type PostAction =
  | {type: 'update_text'; text: string}
  | {type: 'embed_add_images'; images: ComposerImage[]}
  | {type: 'embed_update_image'; image: ComposerImage}
  | {type: 'embed_remove_image'; image: ComposerImage}
  | {
      type: 'embed_add_video'
      asset: ImagePickerAsset
      abortController: AbortController
    }
  | {type: 'embed_remove_video'}
  | {type: 'embed_update_video'; videoAction: VideoAction}
  | {type: 'embed_add_uri'; uri: string}
  | {type: 'embed_remove_link'}

export type ComposerState = {
  post: PostDraft
  mutableNeedsFocusActive: boolean
}

export type ComposerAction = {
  type: 'update_post'
  postAction: PostAction
}

export const MAX_IMAGES = 4

export function composerReducer(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case 'update_post': {
      return {
        ...state,
        post: postReducer(state.post, action.postAction),
      }
    }
  }
}

function postReducer(state: PostDraft, action: PostAction): PostDraft {
  switch (action.type) {
    case 'update_text': {
      return {
        ...state,
        text: action.text,
        shortenedGraphemeLength: action.text.length,
      }
    }
    case 'embed_add_images': {
      if (action.images.length === 0) {
        return state
      }
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'images',
          images: action.images.slice(0, MAX_IMAGES),
        }
      } else if (prevMedia.type === 'images') {
        nextMedia = {
          ...prevMedia,
          images: [...prevMedia.images, ...action.images].slice(0, MAX_IMAGES),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images') {
        const updatedImage = action.image
        const nextMedia = {
          ...prevMedia,
          images: prevMedia.images.map(img => {
            if (img.source.id === updatedImage.source.id) {
              return updatedImage
            }
            return img
          }),
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_remove_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images') {
        const removedImage = action.image
        let nextMedia: ImagesMedia | undefined = {
          ...prevMedia,
          images: prevMedia.images.filter(img => {
            return img.source.id !== removedImage.source.id
          }),
        }
        if (nextMedia.images.length === 0) {
          nextMedia = undefined
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_add_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'video',
          video: createVideoState(action.asset, action.abortController),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_video': {
      const videoAction = action.videoAction
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        nextMedia = {
          ...prevMedia,
          video: videoReducer(prevMedia.video, videoAction),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        prevMedia.video.abortController.abort()
        nextMedia = undefined
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_add_uri': {
      const prevLink = state.embed.link
      let nextLink = prevLink
      if (!prevLink) {
        nextLink = {
          type: 'link',
          uri: action.uri,
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          link: nextLink,
        },
      }
    }
    case 'embed_remove_link': {
      return {
        ...state,
        embed: {
          ...state.embed,
          link: undefined,
        },
      }
    }
  }
}

export function createComposerState({
  initText,
  initImageUris,
}: {
  initText: string | undefined
  initImageUris: ComposerOpts['imageUris']
}): ComposerState {
  let media: ImagesMedia | undefined
  if (initImageUris?.length) {
    media = {
      type: 'images',
      images: createInitialImages(initImageUris),
    }
  }
  const initTextValue = initText || ''
  let link: Link | undefined

  return {
    post: {
      id: nanoid(),
      text: initTextValue,
      shortenedGraphemeLength: initTextValue.length,
      embed: {
        media,
        link,
      },
    },
    mutableNeedsFocusActive: false,
  }
}