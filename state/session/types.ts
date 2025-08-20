import { type PersistedAccount } from '@/state/persisted'

export type SessionAccount = PersistedAccount

export type SessionStateContext = {
  account: SessionAccount | undefined
  hasSession: boolean
  isLoading: boolean
}

export type SessionApiContext = {
  signInWithOAuth: (provider: 'google' | 'apple' | 'azure') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  resumeSession: (account: SessionAccount) => Promise<void>
}