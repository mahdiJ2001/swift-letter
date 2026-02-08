import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { validateWaitlistSubmission, RateLimiter } from '@/lib/validation'

// Rate limiter - 5 attempts per 15 minutes per IP
const rateLimiter = new RateLimiter(5, 15 * 60 * 1000)

export async function POST(request: NextRequest) {
    try {
        // Rate limiting by IP
        const clientIP = request.ip || 
            request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            'unknown'

        if (!rateLimiter.isAllowed(clientIP)) {
            return NextResponse.json(
                { 
                    error: 'Too many attempts. Please try again later.',
                    retryAfter: 900 // 15 minutes in seconds
                },
                { status: 429 }
            )
        }

        const { email, source = 'website' } = await request.json()

        // Enhanced validation
        const validation = validateWaitlistSubmission(email, source)
        
        if (!validation.isValid) {
            return NextResponse.json(
                { 
                    error: validation.errors[0], // Return first error
                    errors: validation.errors // All errors for debugging
                },
                { status: 400 }
            )
        }

        const { email: validatedEmail, source: validatedSource } = validation.sanitized

        const supabase = createRouteHandlerClient({ cookies })

        // Insert email into waitlist with enhanced data
        const { data, error } = await supabase
            .from('waitlist')
            .insert([
                {
                    email: validatedEmail,
                    source: validatedSource,
                    status: 'active',
                    metadata: {
                        ip: clientIP,
                        userAgent: request.headers.get('user-agent') || '',
                        timestamp: new Date().toISOString()
                    }
                }
            ])
            .select('id, email, joined_at')
            .single()

        if (error) {
            // Handle unique constraint violation (email already exists)
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'This email is already on the waitlist' },
                    { status: 409 }
                )
            }
            
            console.error('Waitlist insertion error:', error)
            return NextResponse.json(
                { error: 'Failed to join waitlist' },
                { status: 500 }
            )
        }

        // Get current waitlist count for position
        const { count } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        return NextResponse.json({
            success: true,
            message: 'Successfully joined the waitlist!',
            data: {
                id: data.id,
                email: data.email,
                joined_at: data.joined_at,
                position: count || 1
            }
        })

    } catch (error) {
        console.error('Waitlist API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}