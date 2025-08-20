import { Session } from '@supabase/supabase-js'
import * as AuthSession from 'expo-auth-session'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'

import * as persisted from '@/state/persisted'
import { getInitialState, reducer } from './reducer'
import { getRedirectUrl, supabase } from './supabase-client'
import {
  SessionAccount,
  SessionApiContext,
  SessionStateContext,
} from './types'
import { userToSessionAccount } from './util'

// Warm up browser for better UX
WebBrowser.maybeCompleteAuthSession()

const StateContext = React.createContext<SessionStateContext>({
  account: undefined,
  hasSession: false,
  isLoading: true,
})

const ApiContext = React.createContext<SessionApiContext>({
  signInWithOAuth: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
  resumeSession: async () => {},
})

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const cancelPendingTask = useOneTaskAtATime()
  const [state, dispatch] = React.useReducer(reducer, null, () => {
    const initialState = getInitialState(persisted.get('session').account)
    return initialState
  })

  // Initialize session from storage and Supabase
  React.useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      try {
        // Initialize persisted storage first
        await persisted.init()
        
        // Get persisted account data
        const persistedAccount = persisted.get('session').account
        
        // Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('Error getting session:', error.message)
          if (mounted) {
            dispatch({ type: 'session-restored', account: undefined, supabaseSession: undefined })
          }
          return
        }

        if (session?.user && persistedAccount) {
          // Verify the session matches our persisted account
          if (session.user.id === persistedAccount.id) {
            if (mounted) {
              dispatch({ 
                type: 'session-restored', 
                account: persistedAccount, 
                supabaseSession: session 
              })
            }
          } else {
            // Session mismatch, clear persisted data
            await persisted.clearStorage()
            if (mounted) {
              dispatch({ type: 'session-restored', account: undefined, supabaseSession: undefined })
            }
          }
        } else if (session?.user) {
          // We have a Supabase session but no persisted account, fetch profile
          await handleSessionWithoutProfile(session)
        } else {
          // No session
          if (mounted) {
            dispatch({ type: 'session-restored', account: undefined, supabaseSession: undefined })
          }
        }
      } catch (error) {
        console.log('Error initializing session:', error)
        if (mounted) {
          dispatch({ type: 'session-restored', account: undefined, supabaseSession: undefined })
        }
      }
    }

    const handleSessionWithoutProfile = async (session: Session) => {
      try {
        // Fetch profile data from database
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error
        }

        const account = userToSessionAccount(session.user, profileData)
        
        if (mounted) {
          dispatch({ 
            type: 'session-restored', 
            account, 
            supabaseSession: session 
          })
        }
      } catch (error) {
        console.log('Error fetching profile:', error)
        if (mounted) {
          dispatch({ type: 'session-restored', account: undefined, supabaseSession: undefined })
        }
      }
    }

    initializeSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session) {
        await persisted.clearStorage()
        dispatch({ type: 'signed-out' })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleSessionWithoutProfile(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Persist account data when needed
  React.useEffect(() => {
    if (state.needsPersist) {
      state.needsPersist = false
      persisted.write('session', { account: state.account })
    }
  }, [state])

  const signInWithOAuth = React.useCallback<SessionApiContext['signInWithOAuth']>(
    async (provider) => {
      const signal = cancelPendingTask()
      dispatch({ type: 'session-loading', isLoading: true })

      try {
        const redirectUrl = getRedirectUrl()
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        })

        if (error) throw error

        if (data.url) {
          // Handle mobile OAuth flow
          const result = await AuthSession.startAsync({
            authUrl: data.url,
            returnUrl: redirectUrl,
          })

          if (result.type === 'success' && result.url) {
            const url = new URL(result.url)
            const code = url.searchParams.get('code')
            
            if (code) {
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
              if (exchangeError) throw exchangeError
            }
          } else if (result.type === 'error') {
            throw new Error('OAuth cancelled or failed')
          }
        }

        if (signal.aborted) return

        // Session will be handled by onAuthStateChange
      } catch (error: any) {
        if (signal.aborted) return
        
        console.log('OAuth error:', error.message)
        dispatch({ type: 'session-loading', isLoading: false })
        
        // Show user-friendly error
        if (error.message.includes('Invalid email domain')) {
          alert('Please use your student email address to sign in.')
        } else {
          alert('Sign in failed. Please try again.')
        }
      }
    },
    [cancelPendingTask],
  )

  const signOut = React.useCallback<SessionApiContext['signOut']>(
    async () => {
      const signal = cancelPendingTask()
      dispatch({ type: 'session-loading', isLoading: true })

      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        if (signal.aborted) return

        await persisted.clearStorage()
        dispatch({ type: 'signed-out' })
        
        // Navigate to auth screen
        router.replace('/(auth)/sign-in')
      } catch (error: any) {
        if (signal.aborted) return
        
        console.log('Sign out error:', error.message)
        dispatch({ type: 'session-loading', isLoading: false })
        alert('Sign out failed. Please try again.')
      }
    },
    [cancelPendingTask],
  )

  const refreshSession = React.useCallback<SessionApiContext['refreshSession']>(
    async () => {
      try {
        const { error } = await supabase.auth.refreshSession()
        if (error) throw error
      } catch (error: any) {
        console.log('Refresh session error:', error.message)
      }
    },
    [],
  )

  const updateProfile = React.useCallback<SessionApiContext['updateProfile']>(
    async (updates) => {
      if (!state.account) throw new Error('No active session')

      const signal = cancelPendingTask()

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', state.account.id)

        if (error) throw error

        if (signal.aborted) return

        const updatedAccount: SessionAccount = {
          ...state.account,
          ...updates,
          updated_at: new Date().toISOString(),
        }

        dispatch({ type: 'profile-updated', account: updatedAccount })
      } catch (error: any) {
        if (signal.aborted) return
        
        console.log('Update profile error:', error.message)
        alert('Failed to update profile. Please try again.')
      }
    },
    [state.account, cancelPendingTask],
  )

  const completeProfile = React.useCallback<SessionApiContext['completeProfile']>(
    async () => {
      if (!state.account) throw new Error('No active session')

      const signal = cancelPendingTask()

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            need_profile_complete: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', state.account.id)

        if (error) throw error

        if (signal.aborted) return

        const updatedAccount: SessionAccount = {
          ...state.account,
          need_profile_complete: false,
          updated_at: new Date().toISOString(),
        }

        dispatch({ type: 'profile-completed', account: updatedAccount })
        
        // Navigate to main app
        router.replace('/(tabs)')
      } catch (error: any) {
        if (signal.aborted) return
        
        console.log('Complete profile error:', error.message)
        alert('Failed to complete profile. Please try again.')
      }
    },
    [state.account, cancelPendingTask],
  )

  const stateContext = React.useMemo(
    () => ({
      account: state.account,
      hasSession: !!state.account && !!state.supabaseSession,
      isLoading: state.isLoading,
      needsProfileCompletion: state.account?.need_profile_complete ?? false,
    }),
    [state],
  )

  const api = React.useMemo(
    () => ({
      signInWithOAuth,
      signOut,
      refreshSession,
      updateProfile,
      completeProfile,
    }),
    [signInWithOAuth, signOut, refreshSession, updateProfile, completeProfile],
  )

  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

function useOneTaskAtATime() {
  const abortController = React.useRef<AbortController | null>(null)
  const cancelPendingTask = React.useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()
    return abortController.current.signal
  }, [])
  return cancelPendingTask
}

export function useSession() {
  return React.useContext(StateContext)
}

export function useSessionApi() {
  return React.useContext(ApiContext)
}

export function useRequireAuth() {
  const { hasSession, isLoading } = useSession()

  return React.useCallback(
    (fn: () => void) => {
      if (isLoading) return
      
      if (hasSession) {
        fn()
      } else {
        router.replace('/(auth)/sign-in')
      }
    },
    [hasSession, isLoading],
  )
}