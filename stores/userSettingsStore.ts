// stores/userSettingsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserSettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean | null; // Example future setting
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  fetchSettings: () => Promise<void>;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`[${timestamp}] [UserSettingsStore] Initializing store`);
      
      return {
        theme: 'system',
        notifications: null,
        setTheme: (theme) => {
          console.log(`[${timestamp}] [UserSettingsStore] Setting theme`, { theme });
          set({ theme });
        },
        fetchSettings: async () => {
          console.log(`[${timestamp}] [UserSettingsStore] Fetching settings from Supabase`);
          try {
            const { data, error } = await supabase.rpc('get_user_settings'); // Hypothetical RPC
            if (error) {
              console.log(`[${timestamp}] [UserSettingsStore] get_user_settings error`, { error: error.message });
              throw error;
            }
            console.log(`[${timestamp}] [UserSettingsStore] get_user_settings result`, { data });
            if (data && data.length > 0) {
              set({
                theme: data[0].theme || 'system',
                notifications: data[0].notifications || null,
              });
            }
          } catch (err) {
            console.log(`[${timestamp}] [UserSettingsStore] Failed to fetch settings`, { error: err instanceof Error ? err.message : 'Unknown error' });
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
            theme: state?.theme,
            notifications: state?.notifications,
          });
        };
      },
    }
  )
);