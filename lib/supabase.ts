import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// For client-side components (recommended for auth)
export const supabase = createClientComponentClient<Database>()

// Legacy client for backward compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw error if we're not in build/static generation mode
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('Missing Supabase environment variables')
}

export const supabaseLegacy = supabaseUrl && supabaseAnonKey 
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null

// For server-side operations only (Node.js environment)
export const createSupabaseAdmin = () => {
    if (typeof window !== 'undefined') {
        throw new Error('supabaseAdmin should only be used on the server side')
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !adminSupabaseUrl) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    return createClient<Database>(
        adminSupabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}