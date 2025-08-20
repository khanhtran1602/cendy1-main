import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './userStore';


interface AuthState {
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getSession: () => Promise<Session | null>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  const log = (message: string, data?: any) => {
    console.log(`[${timestamp}] [AuthStore] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  };

  console.log(`[${timestamp}] [AuthStore] Initializing store`);

  return {
    session: null,
    loading: true,
    error: null,
    initialize: async () => {
      log('Initializing session');
      try {
        set({ loading: true, error: null });
        console.log(`[${timestamp}] [AuthStore] Calling auth.getSession`);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log(`[${timestamp}] [AuthStore] getSession error`, { error: error.message });
          throw error;
        }
        console.log(`[${timestamp}] [AuthStore] Initial session retrieved`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null });
        if (session) {
          set({ session, loading: false, error: null });
          console.log(`[${timestamp}] [AuthStore] Session and user set`, { userId: session.user?.id });
        } else {
          set({ session: null, loading: false});
          console.log(`[${timestamp}] [AuthStore] No session, cleared state`);
        }
      } catch (err) {
        console.log(`[${timestamp}] [AuthStore] Error initializing session`, { error: err instanceof Error ? err.message : 'Unknown error' });
        set({ loading: false, error: err instanceof Error ? err : new Error(t('error.initializeSession')) });
      }
    },
    signInWithGoogle: async () => {
      log('Starting Google Sign-In');
      try {
        set({ loading: true, error: null });
        console.log(`[${timestamp}] [AuthStore] Generating redirect URL`);
        const redirectUrl = makeRedirectUri({ scheme: 'cendy', path: 'auth' });
        console.log(`[${timestamp}] [AuthStore] Generated redirect URL`, { redirectUrl });
        console.log(`[${timestamp}] [AuthStore] Calling auth.signInWithOAuth`);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
        });
        if (error) {
          console.log(`[${timestamp}] [AuthStore] OAuth initiation error`, { error: error.message });
          if (error.message.includes('Please sign in with a student email address')) {
            throw new Error(t('error.invalidDomain'));
          }
          throw error;
        }
        if (!data.url) {
          console.log(`[${timestamp}] [AuthStore] No OAuth URL returned`);
          throw new Error(t('error.noOAuthUrl'));
        }
        console.log(`[${timestamp}] [AuthStore] OAuth URL generated`, { url: data.url });
        console.log(`[${timestamp}] [AuthStore] Opening auth session`);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log(`[${timestamp}] [AuthStore] OAuth browser result`, { type: result.type });
        if (result.type === 'success') {
          const { params, errorCode } = QueryParams.getQueryParams(result.url);
          console.log(`[${timestamp}] [AuthStore] Redirect URL params`, { params, errorCode });
          if (errorCode) {
            console.log(`[${timestamp}] [AuthStore] OAuth error code`, { errorCode });
            throw new Error(`${t('error.oauthError')}: ${errorCode}`);
          }
          const { access_token, refresh_token } = params;
          if (!access_token) {
            console.log(`[${timestamp}] [AuthStore] No access token in redirect`);
            throw new Error(t('error.noAccessToken'));
          }
          console.log(`[${timestamp}] [AuthStore] Access token received`, { access_token: access_token.slice(0, 10) + '...' });
          console.log(`[${timestamp}] [AuthStore] Calling auth.setSession`, { access_token: access_token.slice(0, 10) + '...' });
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            console.log(`[${timestamp}] [AuthStore] Session set error`, { error: sessionError.message });
            if (sessionError.message.includes('Please sign in with a student email address')) {
              throw new Error(t('error.invalidDomain'));
            }
            throw sessionError;
          }
          console.log(`[${timestamp}] [AuthStore] Session set successfully`, { userId: sessionData.session?.user?.id, email: sessionData.session?.user?.email });
        } else {
          console.log(`[${timestamp}] [AuthStore] OAuth flow canceled or failed`, { result });
          throw new Error(t('error.oauthCanceled'));
        }
      } catch (err) {
        console.log(`[${timestamp}] [AuthStore] Sign-in error`, { error: err instanceof Error ? err.message : 'Unknown error' });
        set({ loading: false, error: err instanceof Error ? err : new Error(t('error.signIn')) });
      }
    },
    signOut: async () => {
      log('Starting sign-out');
      try {
        set({ loading: true, error: null });
        console.log(`[${timestamp}] [AuthStore] Calling auth.signOut`);
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.log(`[${timestamp}] [AuthStore] Sign-out error`, { error: error.message });
          throw error;
        }
        console.log(`[${timestamp}] [AuthStore] Sign-out successful`);
        set({ session: null, loading: false, error: null });
        console.log(`[${timestamp}] [AuthStore] Clearing user settings`);
        useUserStore.setState({ college: null, display_name: null, username: null, avatar_url: null });
      } catch (err) {
        console.log(`[${timestamp}] [AuthStore] Sign-out error`, { error: err instanceof Error ? err.message : 'Unknown error' });
        set({ loading: false, error: err instanceof Error ? err : new Error(t('error.signOut')) });
      }
    },
    getSession: async () => {
      log('Getting current session');
      try {
        console.log(`[${timestamp}] [AuthStore] Calling auth.getSession`);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log(`[${timestamp}] [AuthStore] Get session error`, { error: error.message });
          throw error;
        }
        console.log(`[${timestamp}] [AuthStore] Session retrieved`, { session: session ? { userId: session.user?.id, email: session.user?.email } : null });
        set({ session, loading: false, error: null });
        console.log(`[${timestamp}] [AuthStore] Session state updated`, { hasSession: !!session });
        return session;
      } catch (err) {
        console.log(`[${timestamp}] [AuthStore] Get session error`, { error: err instanceof Error ? err.message : 'Unknown error' });
        set({ loading: false, error: err instanceof Error ? err : new Error(t('error.getSession')) });
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
  useAuthStore.setState({ session, loading: false, error: null });
});
const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
console.log(`[${timestamp}] [AuthStore] Subscribing to auth state changes and initializing`);
initialize();