import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createRouteHandlerClient({ cookies })
        
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) throw error

            // If user was just confirmed, create their profile if it doesn't exist
            if (data.user) {
                // Check if profile already exists
                const { data: existingProfile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('user_id', data.user.id)
                    .single()

                // If profile doesn't exist, create one
                if (profileError && profileError.code === 'PGRST116') {
                    const { error: createError } = await supabase
                        .from('user_profiles')
                        .insert({
                            user_id: data.user.id,
                            full_name: data.user.user_metadata?.full_name || '',
                            email: data.user.email || '',
                            phone: '',
                            experiences: '',
                            projects: '',
                            skills: '',
                            credits: 5
                        })

                    if (createError) {
                        console.error('Error creating user profile:', createError)
                    }
                }
            }
        } catch (error) {
            console.error('Auth callback error:', error)
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Could not authenticate user`)
        }
    }

    // URL to redirect to after sign in process completes
    const redirectTo = requestUrl.searchParams.get('redirect_to') || '/profile'
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
}