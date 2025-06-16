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
    (set) => ({
      college: null,
      display_name: null,
      username: null,
      avatar_url: null,
      fetchUserInfo: async () => {
        try {
          const { data, error } = await supabase.rpc('get_user_info');
          if (error) throw error;
          if (data && data.length > 0) {
            set({
              college: data[0].college,
              display_name: data[0].display_name,
              username: data[0].username,
              avatar_url: data[0].avatar_url,
            });
          }
        } catch (err) {
          console.error('Failed to fetch user info:', err);
        }
      },
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);