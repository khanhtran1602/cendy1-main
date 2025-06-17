import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserSettingsState {
  college: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  fetchUserInfo: () => Promise<void>;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`[${timestamp}] [UserSettingsStore] Initializing store`);
      
      return {
        college: null,
        display_name: null,
        username: null,
        avatar_url: null,
        fetchUserInfo: async () => {
          console.log(`[${timestamp}] [UserSettingsStore] Calling get_user_info RPC`);
          try {
            const { data, error } = await supabase.rpc('get_user_info');
            if (error) {
              console.log(`[${timestamp}] [UserSettingsStore] get_user_info error`, { error: error.message });
              throw error;
            }
            console.log(`[${timestamp}] [UserSettingsStore] get_user_info result`, { data });
            if (data && data.length > 0) {
              console.log(`[${timestamp}] [UserSettingsStore] Updating state with user info`, {
                college: data[0].college,
                display_name: data[0].display_name,
                username: data[0].username,
                avatar_url: data[0].avatar_url,
              });
              set({
                college: data[0].college,
                display_name: data[0].display_name,
                username: data[0].username,
                avatar_url: data[0].avatar_url,
              });
            } else {
              console.log(`[${timestamp}] [UserSettingsStore] No user info returned`);
            }
          } catch (err) {
            console.log(`[${timestamp}] [UserSettingsStore] Failed to fetch user info`, { error: err instanceof Error ? err.message : 'Unknown error' });
          }
        },
      };
    },
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        return (state) => {
          console.log(`[${timestamp}] [UserSettingsStore] State rehydrated`, {
            college: state?.college,
            display_name: state?.display_name,
            username: state?.username,
            avatar_url: state?.avatar_url,
          });
        };
      },
    }
  )
);