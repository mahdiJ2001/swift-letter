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
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
        }

        // Generate unique filename
        const fileExt = 'pdf'
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = fileName

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload file to the resumes bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json({ 
                error: `Failed to upload file: ${uploadError.message}` 
            }, { status: 500 })
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath)

        const resumeUrl = urlData.publicUrl

        // Update user profile with resume URL
        const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, user_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (fetchError) {
            console.error('Error checking existing profile:', fetchError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        if (existingProfile) {
            // Update existing profile with resume URL
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ resume_url: resumeUrl, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)

            if (updateError) {
                console.error('Error updating profile with resume URL:', updateError)
                // Don't fail the whole operation, just log the error
            }
        }

        return NextResponse.json({
            success: true,
            resumeUrl: resumeUrl,
            message: 'Resume uploaded successfully'
        })

    } catch (error: any) {
        console.error('Resume upload error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to upload resume' },
            { status: 500 }
        )
    }
}