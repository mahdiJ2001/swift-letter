import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, refresh the period stats to ensure they're current
    const { error: refreshError } = await supabase.rpc('calculate_period_users')
    if (refreshError) {
      console.error('Error refreshing period stats:', refreshError)
    }

    // Get the current stats
    const { data: stats, error } = await supabase
      .from('app_stats')
      .select(`
        total_users,
        users_today,
        users_this_week,
        users_last_week,
        users_this_month,
        users_last_month,
        total_letters_generated,
        letters_generated_today,
        letters_generated_this_week,
        letters_generated_this_month,
        total_pdfs_compiled,
        total_pdf_downloads,
        successful_compilations,
        failed_compilations,
        last_user_registered_at,
        last_letter_generated_at
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats: {
        // User Statistics
        users: {
          total: stats.total_users || 0,
          today: stats.users_today || 0,
          thisWeek: stats.users_this_week || 0,
          lastWeek: stats.users_last_week || 0,
          thisMonth: stats.users_this_month || 0,
          lastMonth: stats.users_last_month || 0
        },
        
        // Letter Statistics
        letters: {
          total: stats.total_letters_generated || 0,
          today: stats.letters_generated_today || 0,
          thisWeek: stats.letters_generated_this_week || 0,
          thisMonth: stats.letters_generated_this_month || 0
        },
        
        // PDF Statistics
        pdfs: {
          totalCompiled: stats.total_pdfs_compiled || 0,
          totalDownloads: stats.total_pdf_downloads || 0,
          successful: stats.successful_compilations || 0,
          failed: stats.failed_compilations || 0
        },
        
        // Timestamps
        lastActivity: {
          userRegistered: stats.last_user_registered_at,
          letterGenerated: stats.last_letter_generated_at
        }
      }
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}