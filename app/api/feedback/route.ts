import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const feedback = formData.get('feedback') as string;
    const rating = formData.get('rating') as string;
    const userId = formData.get('userId') as string | null;
    const screenshot = formData.get('screenshot') as File | null;

    if (!feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    let screenshotUrl = null;

    // Upload screenshot if provided
    if (screenshot) {
      try {
        const fileExt = screenshot.name.split('.').pop() || 'png';
        const fileName = `feedback-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('feedback-screenshots')
          .upload(fileName, screenshot, {
            contentType: screenshot.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
          // Don't fail the entire request if screenshot upload fails
        } else {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('feedback-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = publicUrl;
        }
      } catch (uploadError) {
        console.error('Screenshot processing error:', uploadError);
        // Continue without screenshot if upload fails
      }
    }

    // Prepare feedback data
    const feedbackData = {
      user_id: userId || null, // Allow anonymous feedback
      feedback: `${rating && parseInt(rating) > 0 ? `Rating: ${rating}/5 stars\n` : ''}${feedback.trim()}${screenshotUrl ? `\n\nScreenshot: ${screenshotUrl}` : ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert feedback into database
    const { error: insertError } = await supabaseAdmin
      .from('user_feedback')
      .insert(feedbackData);

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your input.'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}