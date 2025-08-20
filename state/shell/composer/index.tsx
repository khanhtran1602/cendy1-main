import React from "react"

export interface ComposerOptsPostRef {
    id: string // UUID from posts.id
    text: string // From captions.text
    user: {
      id: string // UUID from profiles.user_id
      username: string // From profiles.username
      full_name?: string // From profiles.full_name
      display_name?: string // From profiles.display_name
      avatar_url?: string // From profiles.avatar_url
    }
    college: string // From posts.college
    channel: string // From posts.channel
    topic?: string // From posts.topic
    media?: {
      id: string // UUID from media.id
      url: string // From media.url
      media_type: number // From media.media_type
      width?: number // From media.width
      height?: number // From media.height
      video_duration?: number // From media.video_duration
      sequence?: number // From media.sequence
    }[]
    text_post_app_info?: {
      is_reply: boolean // From posts.text_post_app_info
      reply_level?: number // From posts.text_post_app_info
      direct_reply_count?: number // From posts.text_post_app_info
      hush_info?: any // From posts.text_post_app_info (nullable, arbitrary structure)
      is_parent_edited?: boolean // From posts.text_post_app_info
      reply_to_author?: {
        id: string // UUID from profiles.user_id
        username: string // From profiles.username
        full_name?: string // From profiles.full_name
        display_name?: string // From profiles.display_name
        avatar_url?: string // From profiles.avatar_url
      } // From posts.text_post_app_info
      parent_permalink?: string // From posts.text_post_app_info
      reply_to_post_id?: string // From posts.text_post_app_info
      is_liked_by_root_author?: boolean // From posts.text_post_app_info
    }
  }
  
  export type OnPostSuccessData =
    | {
        reply_to_id?: string // From posts.text_post_app_info.reply_to_post_id
        posts: {
          id: string // UUID from posts.id
          text: string // From captions.text
          created_at: string // From posts.created_at
          user: {
            id: string // UUID from profiles.user_id
            username: string // From profiles.username
            full_name?: string // From profiles.full_name
            display_name?: string // From profiles.display_name
            avatar_url?: string // From profiles.avatar_url
          }
          college: string // From posts.college
          channel: string // From posts.channel
          topic?: string // From posts.topic
          media?: {
            id: string // UUID from media.id
            url: string // From media.url
            media_type: number // From media.media_type
            width?: number // From media.width
            height?: number // From media.height
            video_duration?: number // From media.video_duration
            sequence?: number // From media.sequence
          }[]
          text_post_app_info?: {
            is_reply: boolean // From posts.text_post_app_info
            reply_level?: number // From posts.text_post_app_info
            direct_reply_count?: number // From posts.text_post_app_info
            hush_info?: any // From posts.text_post_app_info (nullable, arbitrary structure)
            is_parent_edited?: boolean // From posts.text_post_app_info
            reply_to_author?: {
              id: string // UUID from profiles.user_id
              username: string // From profiles.username
              full_name?: string // From profiles.full_name
              display_name?: string // From profiles.display_name
              avatar_url?: string // From profiles.avatar_url
            } // From posts.text_post_app_info
            parent_permalink?: string // From posts.text_post_app_info
            reply_to_post_id?: string // From posts.text_post_app_info
            is_liked_by_root_author?: boolean // From posts.text_post_app_info
          }
        }[]
      }
    | undefined
  
  export interface ComposerOpts {
    replyTo?: ComposerOptsPostRef // Reference to the post being replied to
    onPost?: (postId: string | undefined) => void // Callback with the new post ID
    onPostSuccess?: (data: OnPostSuccessData) => void // Callback with detailed post data
    text?: string // Initial post text
    college?: string // Initial college value
    channel?: string // Initial channel value
    topic?: string // Initial topic value
    imageUris?: { uri: string; width: number; height: number}[] // Images to upload
    videoUri?: { uri: string; width: number; height: number; video_duration?: number } // Video to upload
  }

  type StateContext = ComposerOpts | undefined
  type ControlsContext = {
    openComposer: (opts: ComposerOpts) => void
    closeComposer: () => boolean
  }
  
  const stateContext = React.createContext<StateContext>(undefined)
  const controlsContext = React.createContext<ControlsContext>({
    openComposer(_opts: ComposerOpts) {},
    closeComposer() {
      return false
    },
  })
  
  export function useComposerState() {
    return React.useContext(stateContext)
  }
  
  export function useComposerControls() {
    const {closeComposer} = React.useContext(controlsContext)
    return React.useMemo(() => ({closeComposer}), [closeComposer])
  }
  
  /**
   * DO NOT USE DIRECTLY. The deprecation notice as a warning only, it's not
   * actually deprecated.
   *
   * @deprecated use `#/lib/hooks/useOpenComposer` instead
   */
  export function useOpenComposer() {
    const {openComposer} = React.useContext(controlsContext)
    return React.useMemo(() => ({openComposer}), [openComposer])
  }