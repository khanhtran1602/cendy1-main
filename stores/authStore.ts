import type { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  need_profile_complete: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getSession: () => Promise<Session | null>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Use i18next within actions
  const { t } = useTranslation();

  // Helper to log with timestamp
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${timestamp}] [AuthStore] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  };

  return {
    session: null,
    user: null,
    loading: true,
    error: null,
    profile: null,
    initialize: async () => {
      log('Initializing session');
      try {
        set({ loading: true, error: null });
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        log('Initial session retrieved', { session: session ? { userId: session.user?.id, email: session.user?.email } : null });
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      } catch (err) {
        log('Error initializing session', err);
        set({
          loading: false,
          error: err instanceof Error ? err : new Error(t('error.initializeSession')),
        });
      }
    },

    // Sign in with Google
    signInWithGoogle: async () => {
      log('Starting Google Sign-In');
      try {
        set({ loading: true, error: null });
        const redirectUrl = makeRedirectUri({ scheme: 'cendy', path: 'auth' });
        log('Generated redirect URL', { redirectUrl });
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          log('OAuth initiation error', error);
          if (error.message.includes('Please sign in with a student email address')) {
            throw new Error(t('error.invalidDomain'));
          }
          throw error;
        }
        if (!data.url) {
          log('No OAuth URL returned');
          throw new Error(t('error.noOAuthUrl'));
        }
        log('OAuth URL generated', { url: data.url });

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        log('OAuth browser result', { type: result.type });

        if (result.type === 'success') {
          const { params, errorCode } = QueryParams.getQueryParams(result.url);
          log('Redirect URL params', { params, errorCode });
          if (errorCode) throw new Error(`${t('error.oauthError')}: ${errorCode}`);

          const { access_token, refresh_token } = params;
          if (!access_token) {
            log('No access token in redirect');
            throw new Error(t('error.noAccessToken'));
          }
          log('Access token received', { access_token: access_token.slice(0, 10) + '...' });

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            log('Session set error', sessionError);
            if (sessionError.message.includes('Please sign in with a student email address')) {
              throw new Error(t('error.invalidDomain'));
            }
            throw sessionError;
          }

          log('Session set successfully', { userId: sessionData.session?.user?.id, email: sessionData.session?.user?.email });
          set({
            session: sessionData.session,
            user: sessionData.session?.user ?? null,
            loading: false,
            error: null,
          });
        } else {
          log('OAuth flow canceled or failed', { result });
          throw new Error(t('error.oauthCanceled'));
        }
      } catch (err) {
        log('Sign-in error', err);
        set({
          loading: false,
          error: err instanceof Error ? err : new Error(t('error.signIn')),
        });
      }
    },

    // Sign out
    signOut: async () => {
      log('Starting sign-out');
      try {
        set({ loading: true, error: null });
        const { error } = await supabase.auth.signOut();
        if (error) {
          log('Sign-out error', error);
          throw error;
        }
        log('Sign-out successful');
        set({
          session: null,
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      } catch (err) {
        log('Sign-out error', err);
        set({
          loading: false,
          error: err instanceof Error ? err : new Error(t('error.signOut')),
        });
      }
    },

    // Get current session
    getSession: async () => {
      log('Getting current session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          log('Get session error', error);
          throw error;
        }
        log('Session retrieved', { session: session ? { userId: session.user?.id, email: session.user?.email } : null });
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
        return session;
      } catch (err) {
        log('Get session error', err);
        set({
          loading: false,
          error: err instanceof Error ? err : new Error(t('error.getSession')),
        });
        return null;
      }
    },
  };
});

// Subscribe to auth state changes
const { initialize } = useAuthStore.getState();
supabase.auth.onAuthStateChange((event, session) => {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`[${timestamp}] [AuthStore] Auth state changed`, { event, session: session ? { userId: session.user?.id, email: session.user?.email } : null });
  useAuthStore.setState({
    session,
    user: session?.user ?? null,
    loading: false,
    error: null,
  });
});
initialize();