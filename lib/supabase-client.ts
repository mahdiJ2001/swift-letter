'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabase = () => {
  if (typeof window === 'undefined') {
    // Return a mock client for SSR
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        insert: () => Promise.resolve({ error: null }),
        select: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ error: null }),
        delete: () => Promise.resolve({ error: null }),
      }),
    }
  }

  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>()
  }
  
  return supabaseInstance
}

export const supabase = getSupabase()