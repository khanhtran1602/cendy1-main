// stores/userStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserState {
  college: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  fetchUserInfo: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`[${timestamp}] [UserStore] Initializing store`);
      return {
        college: null,
        display_name: null,
        username: null,
        avatar_url: null,
        bio: null,
        fetchUserInfo: async () => {
          console.log(`[${timestamp}] [UserStore] Calling get_user_info RPC`);
          try {
            const { data, error } = await supabase.rpc('get_user_info');
            if (error) {
              console.log(`[${timestamp}] [UserStore] get_user_info error`, { error: error.message });
              throw error;
            }
            console.log(`[${timestamp}] [UserStore] get_user_info result`, { data });
            if (data && data.length > 0) {
              console.log(`[${timestamp}] [UserStore] Updating state with user info`, {
                college: data[0].college,
                display_name: data[0].display_name,
                username: data[0].username,
                avatar_url: data[0].avatar_url,
                bio: data[0].bio,
              });
              set({
                college: data[0].college,
                display_name: data[0].display_name,
                username: data[0].username,
                avatar_url: data[0].avatar_url,
                bio: data[0].bio,
              });
            } else {
              console.log(`[${timestamp}] [UserStore] No user info returned`);
            }
          } catch (err) {
            console.log(`[${timestamp}] [UserStore] Failed to fetch user info`, { error: err instanceof Error ? err.message : 'Unknown error' });
          }
        },
      };
    },
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        college: state.college,
        display_name: state.display_name,
        username: state.username,
        avatar_url: state.avatar_url,
      }), // Exclude bio or other large fields from persistence
      onRehydrateStorage: () => {
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        return (state) => {
          console.log(`[${timestamp}] [UserStore] State rehydrated`, {
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