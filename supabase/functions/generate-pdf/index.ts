import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Client for user authentication (anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for internal operations (service role key) - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to increment failed compilations stat
async function incrementFailedCompilations() {
  try {
    await supabaseAdmin.rpc('increment_app_stat', { 
      stat_column: 'failed_letter_compilations', 
      amount: 1 
    });
  } catch (error) {
    console.error('Failed to increment failed compilations stat:', error);
  }
}

// Helper function to increment PDF downloads stat
async function incrementPdfDownloads() {
  try {
    // Use raw SQL to increment the counter
    const { error } = await supabaseAdmin.rpc('increment_app_stat', {
      stat_column: 'total_pdf_downloads',
      amount: 1
    });
    if (error) {
      console.error('Failed to increment PDF downloads stat via RPC:', error);
      // Fallback: direct update
      await supabaseAdmin
        .from('app_stats')
        .update({ updated_at: new Date().toISOString() })
        .select();
    }
  } catch (error) {
    console.error('Failed to increment PDF downloads stat:', error);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latex } = await req.json();

    if (!latex) {
      return new Response(
        JSON.stringify({ error: 'LaTeX content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 Generating PDF for user:', user.id.slice(-8));

    // Call AWS Lambda for PDF compilation
    const lambdaResponse = await fetch(
      "https://b22kfsayua.execute-api.us-east-1.amazonaws.com/prod/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latex_content: latex,
        }),
      }
    );

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error('Lambda error:', errorText);
      
      // Track failed PDF compilation
      await incrementFailedCompilations();
      
      return new Response(
        JSON.stringify({ 
          error: "PDF compilation failed", 
          details: errorText 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle Lambda response as binary PDF
    let base64Pdf: string;
    
    try {
      // Get response as ArrayBuffer to handle binary PDF data properly
      const pdfBuffer = await lambdaResponse.arrayBuffer();
      
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(pdfBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64Pdf = btoa(binary);
      
      console.log('PDF converted to base64, length:', base64Pdf.length);
      
    } catch (error) {
      console.error('Error processing PDF response:', error);
      return new Response(
        JSON.stringify({ error: "Failed to process PDF response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!base64Pdf) {
      // Track failed compilation
      await incrementFailedCompilations();
      
      return new Response(
        JSON.stringify({ error: "No PDF content received from Lambda" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ PDF generated successfully, size:', Math.round(base64Pdf.length * 0.75), 'bytes');

    // Track successful PDF download
    await incrementPdfDownloads();

    // Return JSON with base64 PDF data
    return new Response(
      JSON.stringify({
        success: true,
        pdfData: base64Pdf
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    
    // Track failed compilation
    await incrementFailedCompilations();
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate PDF' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});