import { User } from '@supabase/supabase-js'
import { SessionAccount } from './types'

export function userToSessionAccount(user: User, profileData?: any): SessionAccount {
  const metadata = user.user_metadata || {}
  const appMetadata = user.app_metadata || {}
  
  return {
    id: user.id,
    email: user.email,
    provider: (appMetadata.provider || 'google') as 'google' | 'apple' | 'azure',
    college: appMetadata.college || profileData?.college || 'unknown',
    username: profileData?.username,
    full_name: profileData?.full_name || metadata.full_name || metadata.name,
    display_name: profileData?.display_name,
    avatar_url: profileData?.avatar_url || metadata.avatar_url || metadata.picture,
    need_profile_complete: profileData?.need_profile_complete ?? true,
    created_at: user.created_at,
    updated_at: profileData?.updated_at || user.updated_at,
  }
}

export function extractCollegeFromEmail(email: string): string {
  // This would be implemented based on your JWT hook logic
  // For now, extract domain and map to college names
  const domain = email.split('@')[1]
  
  // Example mapping - replace with your actual logic
  const collegeMap: Record<string, string> = {
    'student.tdtu.edu.vn': 'TDTU',
    'berkeley.edu': 'UC Berkeley',
    'stanford.edu': 'Stanford',
    // Add more mappings
  }
  
  return collegeMap[domain] || 'Unknown College'
}