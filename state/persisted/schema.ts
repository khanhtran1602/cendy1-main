import { z } from 'zod'

const accountSchema = z.object({
  id: z.string(), // Supabase user ID
  email: z.string().optional(),
  provider: z.enum(['google', 'apple', 'azure']),
  college: z.string().optional(),
  username: z.string().optional(),
  full_name: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().optional(),
  need_profile_complete: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type PersistedAccount = z.infer<typeof accountSchema>
export type SessionAccount = PersistedAccount

export type SessionStateContext = {
  currentAccount: SessionAccount | undefined
  hasSession: boolean
  isLoading: boolean
  needsProfileCompletion: boolean
}

export type SessionApiContext = {
  signInWithOAuth: (provider: 'google' | 'apple' | 'azure') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (updates: Partial<Pick<SessionAccount, 'username' | 'full_name' | 'display_name' | 'avatar_url'>>) => Promise<void>
  completeProfile: () => Promise<void>
}

const schema = z.object({
  colorMode: z.enum(['system', 'light', 'dark']),
  currentAccount: accountSchema.optional(),
  appLanguage: z.string(),
  invites: z.object({
    copiedInvites: z.array(z.string()),
  }),
  hiddenPosts: z.array(z.string()).optional(),
  useInAppBrowser: z.boolean().optional(),
  lastSelectedHomeFeed: z.string().optional(),
  disableAutoplay: z.boolean().optional(),
})
export type Schema = z.infer<typeof schema>

export const defaults: Schema = {
  colorMode: 'system',
  currentAccount: undefined,
  appLanguage: 'en',
  invites: {
    copiedInvites: [],  
  },
  hiddenPosts: [],
  useInAppBrowser: undefined,
  lastSelectedHomeFeed: undefined,
  disableAutoplay: false,
}

export function tryParse(rawData: string): Schema | undefined {
  let objData
  try {
    objData = JSON.parse(rawData)
  } catch (e) {
    console.error('persisted state: failed to parse root state from storage', {
      message: e,
    })
  }
  if (!objData) {
    return undefined
  }
  const parsed = schema.safeParse(objData)
  if (parsed.success) {
    return objData
  } else {
    const errors =
      parsed.error?.errors?.map(e => ({
        code: e.code,
        // @ts-ignore exists on some types
        expected: e?.expected,
        path: e.path?.join('.'),
      })) || []
    console.error(`persisted store: data failed validation on read`, {errors})
    return undefined
  }
}

export function tryStringify(value: Schema): string | undefined {
  try {
    schema.parse(value)
    return JSON.stringify(value)
  } catch (e) {
    console.error(`persisted state: failed stringifying root state`, {
      message: e,
    })
    return undefined
  }
}