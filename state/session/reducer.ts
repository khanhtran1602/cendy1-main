import { Session } from '@supabase/supabase-js'
import { SessionAccount } from './types'

export type State = {
  readonly account: SessionAccount | undefined
  readonly supabaseSession: Session | undefined
  readonly isLoading: boolean
  needsPersist: boolean // Mutated in an effect
}

export type Action =
  | {
      type: 'session-loading'
      isLoading: boolean
    }
  | {
      type: 'session-restored'
      account: SessionAccount | undefined
      supabaseSession: Session | undefined
    }
  | {
      type: 'signed-in'
      account: SessionAccount
      supabaseSession: Session
    }
  | {
      type: 'signed-out'
    }
  | {
      type: 'profile-updated'
      account: SessionAccount
    }
  | {
      type: 'profile-completed'
      account: SessionAccount
    }
  | {
      type: 'synced-account'
      syncedAccount: SessionAccount | undefined
    }

export function getInitialState(persistedAccount: SessionAccount | undefined): State {
  return {
    account: persistedAccount,
    supabaseSession: undefined,
    isLoading: true,
    needsPersist: false,
  }
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'session-loading': {
      return {
        ...state,
        isLoading: action.isLoading,
      }
    }
    case 'session-restored': {
      return {
        ...state,
        account: action.account,
        supabaseSession: action.supabaseSession,
        isLoading: false,
        needsPersist: false,
      }
    }
    case 'signed-in': {
      return {
        ...state,
        account: action.account,
        supabaseSession: action.supabaseSession,
        isLoading: false,
        needsPersist: true,
      }
    }
    case 'signed-out': {
      return {
        ...state,
        account: undefined,
        supabaseSession: undefined,
        isLoading: false,
        needsPersist: true,
      }
    }
    case 'profile-updated': {
      return {
        ...state,
        account: action.account,
        needsPersist: true,
      }
    }
    case 'profile-completed': {
      return {
        ...state,
        account: action.account,
        needsPersist: true,
      }
    }
    case 'synced-account': {
      return {
        ...state,
        account: action.syncedAccount,
        needsPersist: false,
      }
    }
    default:
      return state
  }
}