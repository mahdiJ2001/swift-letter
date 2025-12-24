import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    try {
        // Check if Supabase environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable' },
                { status: 503 }
            )
        }
        
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get userId from query parameters (for additional verification)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        
        if (userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Fetch user profile
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "not found" which is okay for new users
            throw error
        }

        if (!profile) {
            return NextResponse.json(null, { status: 404 })
        }

        return NextResponse.json(profile)
    } catch (error: any) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check if Supabase environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable' },
                { status: 503 }
            )
        }
        
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const profileData = await request.json()
        
        const result = await supabase
            .from('user_profiles')
            .insert({
                ...profileData,
                user_id: session.user.id,
                credits: 3 // 3 free credits for new users
            })
            .select()
            .single()

        if (result.error) {
            throw result.error
        }

        return NextResponse.json(result.data)
    } catch (error: any) {
        console.error('Profile creation error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Check if Supabase environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable' },
                { status: 503 }
            )
        }
        
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get the current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id, ...profileData } = await request.json()
        
        // First, check if a profile exists for this user
        const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, user_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (fetchError) {
            console.error('Error checking existing profile:', fetchError)
            return NextResponse.json(
                { error: 'Failed to check existing profile' },
                { status: 500 }
            )
        }

        let result;
        
        if (existingProfile) {
            // Update existing profile
            result = await supabase
                .from('user_profiles')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', session.user.id)  // Use user_id instead of id for WHERE clause
                .select()
                .single()
        } else {
            // Create new profile
            result = await supabase
                .from('user_profiles')
                .insert({
                    user_id: session.user.id,
                    ...profileData,
                    credits: 3, // 3 free credits for new users
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()
        }

        if (result.error) {
            console.error('Profile operation error:', result.error)
            return NextResponse.json(
                { error: result.error.message || 'Failed to save profile' },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data)
    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to save profile' },
            { status: 500 }
        )
    }
}