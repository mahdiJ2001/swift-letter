import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
        
        const { name, email, subject, message } = await request.json()

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            )
        }

        // Insert contact message into database
        const { data, error } = await supabase
            .from('contacts')
            .insert([
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    subject: subject?.trim() || null,
                    message: message.trim(),
                    created_at: new Date().toISOString()
                }
            ])
            .select()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Failed to save contact message. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { 
                message: 'Contact message sent successfully',
                data: data[0]
            },
            { status: 201 }
        )

    } catch (error) {
        console.error('Contact API error:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        )
    }
}