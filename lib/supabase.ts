import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// For client-side components (recommended for auth)
export const supabase = createClientComponentClient<Database>()

// Legacy client for backward compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabaseLegacy = createClient<Database>(supabaseUrl, supabaseAnonKey)

// For server-side operations only (Node.js environment)
export const createSupabaseAdmin = () => {
    if (typeof window !== 'undefined') {
        throw new Error('supabaseAdmin should only be used on the server side')
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    return createClient<Database>(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}