import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidFeedback, sanitizeInput, RateLimiter } from '@/lib/validation';

// Rate limiter - 3 feedback submissions per 30 minutes per IP
const feedbackRateLimiter = new RateLimiter(3, 30 * 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    if (!feedbackRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { 
          error: 'Too many feedback submissions. Please try again later.',
          retryAfter: 1800 // 30 minutes in seconds
        },
        { status: 429 }
      )
    }
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

    // Enhanced feedback validation
    const feedbackValidation = isValidFeedback(feedback);
    if (!feedbackValidation.isValid) {
      return NextResponse.json(
        { error: feedbackValidation.error },
        { status: 400 }
      );
    }

    // Sanitize feedback content
    const sanitizedFeedback = sanitizeInput(feedback);
    
    // Validate rating if provided
    let validatedRating = null;
    if (rating && rating.trim()) {
      const ratingNumber = parseInt(rating);
      if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      validatedRating = ratingNumber;
    }

    let screenshotUrl = null;

    // Upload screenshot if provided with enhanced validation
    if (screenshot) {
      try {
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(screenshot.type)) {
          return NextResponse.json(
            { error: 'Screenshot must be a PNG, JPEG, or WebP image' },
            { status: 400 }
          );
        }

        // Validate file size (5MB limit)
        if (screenshot.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Screenshot must be less than 5MB' },
            { status: 400 }
          );
        }

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
          return NextResponse.json(
            { error: 'Failed to upload screenshot. Please try without the image.' },
            { status: 500 }
          );
        } else {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('feedback-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = publicUrl;
        }
      } catch (uploadError) {
        console.error('Screenshot processing error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to process screenshot' },
          { status: 500 }
        );
      }
    }

    // Prepare enhanced feedback data with separate fields
    const feedbackData = {
      user_id: userId || null, // Allow anonymous feedback
      feedback: sanitizedFeedback,
      rating: validatedRating,
      screenshot_url: screenshotUrl,
      metadata: {
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || '',
        submission_time: new Date().toISOString()
      },
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