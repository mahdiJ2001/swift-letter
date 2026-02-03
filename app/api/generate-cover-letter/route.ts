import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const { profile, jobDescription, language = 'english', generationMode = 'polished' } = await request.json()

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
      body: {
        profile,
        jobDescription,
        language,
        generationMode
      },
      headers: {
        Authorization: authHeader,
      },
    })

    if (error) {
      console.error('Supabase function error:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: error.message || 'Edge Function error' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}