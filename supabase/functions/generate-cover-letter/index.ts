import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

// AWS V4 Signature helper functions
async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await crypto.subtle.digest('SHA-256', data);
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyBuffer = key instanceof Uint8Array ? new Uint8Array(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmac(encoder.encode('AWS4' + key), dateStamp);
  const kRegion = await hmac(kDate, regionName);
  const kService = await hmac(kRegion, serviceName);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, jobDescription, language = 'english', generationMode = 'polished' } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info using Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Generating cover letter for authenticated user:', user.id.slice(-8));

    // Check user credits and user type
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin users have unlimited credits
    const isAdmin = userProfile?.user_type === 'admin';
    const currentCredits = userProfile?.credits || 0;

    // Check if user has credits (admins bypass this check)
    if (!isAdmin && currentCredits <= 0) {
      console.log('❌ User has no credits remaining');
      return new Response(
        JSON.stringify({ 
          error: 'No credits remaining. Please purchase more credits to continue generating cover letters.',
          credits: 0
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💳 User credits: ${isAdmin ? 'UNLIMITED (admin)' : currentCredits}`);

    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials are not configured');
    }

    // AWS Bedrock configuration
    const region = "us-east-1";
    
    // ORIGINAL MODEL: Claude 3 Sonnet (slower, higher quality)
    // const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
    
    // TESTING MODEL: Claude 3.5 Haiku (faster, good for structured tasks)
    // Requires inference profile instead of direct model ID
    const modelId = "us.anthropic.claude-3-5-haiku-20241022-v1:0";
    
    const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;

    // Create the pppppprompt for Claude - generate complete LaTeX document using specific template
    const prompt = `You are an expert cover letter writer. You must fill in the following template with relevant information from the candidate profile and job description. Follow this EXACT template structure:

CANDIDATE PROFILE:
- Name: ${profile.full_name}
- Email: ${profile.email}
- Phone: ${profile.phone}
- Location: ${profile.location || 'Not specified'}
- LinkedIn: ${profile.linkedin || 'Not provided'}
- GitHub: ${profile.github || 'Not provided'}
- Portfolio: ${profile.portfolio || 'Not provided'}

EXPERIENCE:
${profile.experiences}

SKILLS:
${profile.skills}

EDUCATION:
${profile.education || 'Not specified'}

PROJECTS:
${profile.projects || 'Not specified'}

CERTIFICATIONS:
${profile.certifications || 'Not specified'}

LANGUAGES:
${profile.languages || 'Not specified'}



JOB DESCRIPTION:
${jobDescription}

LANGUAGE: ${language}
${language === 'french' ? 'IMPORTANT: Generate the entire cover letter in French. Use proper French business letter format and professional French language.' : 'Generate the cover letter in English.'}

TEMPLATE TO FOLLOW EXACTLY:
You must create a complete LaTeX document that follows this EXACT structure. Replace the recipient data and letter body content, but keep ALL formatting exactly as shown:

\\documentclass[11pt,a4paper]{article}

% Core packages
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{xcolor}

% --- USER DATA (Change these) ---
\\newcommand{\\myname}{${profile.full_name}}
\\newcommand{\\mylocation}{${profile.location || 'Remote'}}
\\newcommand{\\myemail}{${profile.email}}
\\newcommand{\\myphone}{${profile.phone}}
\\newcommand{\\mylinkedin}{${profile.linkedin ? profile.linkedin.replace('https://', '').replace('http://', '') : 'linkedin.com/in/profile'}}

% --- RECIPIENT DATA (Change these) ---
\\newcommand{\\recipientName}{Hiring Manager}
\\newcommand{\\targetPosition}{Software Engineer}
\\newcommand{\\targetCompany}{Innovative Tech Solutions}
\\newcommand{\\targetSubject}{Application for \\targetPosition at \\targetCompany}

% Professional color scheme
\\definecolor{accentcolor}{RGB}{0, 51, 102}
\\definecolor{lightgray}{RGB}{100, 100, 100}

% Hyperlink styling
\\hypersetup{
    colorlinks=true,
    urlcolor=accentcolor,
    linkcolor=accentcolor
}

\\pagestyle{empty}

% Spacing adjustments
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.85em}
\\renewcommand{\\baselinestretch}{1.15}

% Custom commands for styling
\\newcommand{\\headername}[1]{{\\fontsize{18}{22}\\selectfont\\textbf{\\textcolor{accentcolor}{#1}}}}
\\newcommand{\\contactline}[1]{{\\small\\textcolor{lightgray}{#1}}}

\\begin{document}

% =========================
% Header
% =========================
\\begin{center}
    \\headername{\\myname} \\\\
    \\vspace{0.5em}
    \\contactline{\\mylocation \\ • \\href{mailto:\\myemail}{\\myemail} \\ • \\myphone \\ • \\href{https://\\mylinkedin}{LinkedIn}}
\\end{center}

\\vspace{1.5em}

% Date
{\\small\\textcolor{lightgray}{\\today}}

\\vspace{1em}

% =========================
% Recipient Information
% =========================
\\begin{flushleft}
    \\textbf{To:} \\recipientName \\\\
    \\textbf{Position:} \\targetPosition \\\\
    \\textbf{Company:} \\targetCompany
\\end{flushleft}

\\vspace{0.5em}

% Subject line
\\textbf{Subject: \\targetSubject}

\\vspace{1.5em}

% =========================
% Letter Body
% =========================
Hey \\targetCompany\\ hiring team,

Lately, I've spent time reflecting on where my engineering path should go. And I have decided that sharpening my skills in [Tech A] and [Tech B] while diving into [Tech C] and [related Tech C area] is the way to go. Your \\targetPosition\\ role showed up at just the right moment. It lines up with my goals closely enough that ignoring it didn't feel like an option.

A project I recently completed lines up closely with your needs. Take [Year] - I finished building [Most Recent Project] powered by [key tech stack] under the hood. Before that, in [Year], I worked on [Older Project] [brief description with key tech]. That [Most Recent Project domain] work showed me [specific skill/insight].On the other hand, The [Older Project domain] deepened my skills around [different skill/insight]. Honestly? Both cases rooted me firmly in [combined relevant technologies].

Right now, my career vision pulls me toward growing as a \\targetPosition\\ at \\targetCompany\\ . With skills rooted in [Tech A], [Tech B], and [Tech C], joining feels like stepping into meaningful work and I am both : delighted to start solving problems from the get go and enthusiastic about how I can fit in your current roadmap.

Appreciate you spending a moment on this .

\\vspace{2.0em}

${language === 'french' ? 'Cordialement' : 'Sincerely'},\\\\
\\textbf{\\myname}

\\end{document}

CRITICAL INSTRUCTIONS:
0. CONVERSATIONAL TONE: When filling out this template, maintain the casual, conversational tone. Use simple tech terms, avoid corporate buzzwords, and describe projects like you're explaining them to a colleague, not writing documentation. Keep hyphens, not em dashes. BANNED WORDS: leverage, utilize, implement, architect, robust, seamless, cutting-edge, production-grade.
1. MANDATORY PROJECT OPTIMIZATION: Before selecting projects, calculate which 2-3 project combination covers the MAXIMUM number of job requirements. DO NOT proceed without this calculation.
0.5. MANDATORY CHRONOLOGICAL SORTING: After selecting optimal projects, sort them by date (newest to oldest). The project described as "just wrapped up" MUST be the most recent project. Projects described as "before that" MUST be older. VERIFY dates before writing.
1. Extract the job title and company name from the job description
2. NATURAL JOB TITLE EXTRACTION: Clean up job titles to sound natural. Remove technical specifications in parentheses or brackets. For example:
   - "Software Engineer (Java / Spring Boot / Cloud)" becomes "Software Engineer"
   - "Frontend Developer (React/Node.js)" becomes "Frontend Developer"
   - "Data Scientist - Machine Learning (Python)" becomes "Data Scientist"
   - Keep only the core job title, remove technology stack specifications
3. Update ONLY these lines in the template:
   - \\newcommand{\\targetPosition}{[Replace with cleaned, natural job title]}
   - \\newcommand{\\targetCompany}{[Replace with actual company name]}
4. STRICT TEMPLATE ADHERENCE: Replace the letter body content (between "To the Hiring Team at \\targetCompany," and "Thanks for taking the time to look this over.") with personalized content following the EXACT template structure shown. DO NOT change the paragraph structure, sentence flow, or overall template format.
5. PLACEHOLDER FILLING RULE: Fill in the bracketed placeholders [Tech A], [Tech B], [Tech C], [specific goal], [Project Name], [describe problem], [fix], [specific part], [result], [specific skill], [relevant technical task], [specific product/service], [career goal], [Tech A/B] naturally and conversationally - DO NOT just copy-paste from the user profile.
6. NATURAL LANGUAGE IN TEMPLATE: When filling the template, use natural conversational language:
7. PROJECT SELECTION: Calculate which 2-3 project combination covers the MAXIMUM number of job requirements. Sort selected projects chronologically (newest first).
8. Write ${language === 'french' ? 'in French' : 'in English'} using information from the user profile and job description
9. Keep ALL other LaTeX formatting, commands, and structure EXACTLY as shown
10. Do NOT add any extra LaTeX commands like \\noindent or \\vspace in the letter body
13. Do NOT use phrases like "I am confident that" - replace with more natural language like "I believe", "I think", or "it seems like"
14. CRITICAL: Never use single dashes (-) or double dashes (--) anywhere in the generated content - these are AI telltales
15. CRITICAL: Always properly escape percentage symbols - write 96\\% not just 96 to ensure percentages display correctly in the final PDF


PROJECT SELECTION:
- Select 2-3 projects that cover MAXIMUM job requirements with LEAST technology overlap
- NEVER mix technologies/details from different projects
- Verify project dates for correct chronological order (newest as "just wrapped up", older as "before that")
- Each project description must only use its own actual technologies

CONTENT REQUIREMENTS:
- Use only information from user's profile - DO NOT invent details
- Casual, conversational tone - avoid corporate buzzwords, describe projects like explaining to a colleague
- Fill bracketed placeholders naturally
- Keep under 400 words
- Use hyphens (-) not em dashes, simple tech terms only

OUTPUT FORMAT:
- Return ONLY the complete LaTeX document starting with \\documentclass
- Do NOT wrap in markdown code blocks
- Pure, compilable LaTeX with proper character escaping (% → \\%, & → \\&)
- Never use double quotes (") - use single quotes (') instead

Your response should start exactly with: \\documentclass[11pt,a4paper]{article}`;

    console.log('🔍 Sending prompt to Claude with template structure...');

    // Prepare request for AWS Bedrock (Claude 3 Sonnet format)
    const requestBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Create AWS V4 signature
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const host = `bedrock-runtime.${region}.amazonaws.com`;
    // URL encode the model ID (colons become %3A)
    const encodedModelId = modelId.replace(/:/g, '%3A');
    const canonicalUri = `/model/${encodedModelId}/invoke`;
    const canonicalQuerystring = '';
    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';

    const payloadHash = hex(await sha256(requestBody));
    const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/bedrock/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hex(await sha256(canonicalRequest))}`;

    const signingKey = await getSignatureKey(awsSecretAccessKey, dateStamp, region, 'bedrock');
    const signature = hex(await hmac(signingKey, stringToSign));

    const authorizationHeader = `${algorithm} Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader,
      'Host': host,
    };

    console.log('Calling AWS Bedrock Claude 3 Sonnet...');

    // Call Bedrock API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bedrock API error:', response.status, errorText);
      throw new Error(`Bedrock API error: ${response.status} - ${errorText}`);
    }

    const responseBody = await response.json();
    console.log('Bedrock response received');

    // Extract content from Claude response
    let coverLetter = responseBody.content[0].text;

    console.log('📝 Raw Claude response length:', coverLetter.length);
    console.log('📝 First 200 chars:', coverLetter.substring(0, 200));

    // Clean up the LaTeX content to ensure proper formatting
    coverLetter = coverLetter
      .trim() // Remove leading/trailing whitespace
      .replace(/^```latex\n?/, '') // Remove opening latex code block
      .replace(/\n?```$/, '') // Remove closing code block
      .replace(/^\s*latex\s*\n/, '') // Remove standalone "latex" line
      .replace(/\\\\noindent/g, '') // Remove malformed noindent commands
      .replace(/\\noindent\s*/g, '') // Remove all noindent commands  
      .replace(/\\vspace\{?5pt\}?/g, '') // Remove manual vspace commands
      .replace(/\\vspace\{?10pt\}?/g, '') // Remove manual vspace commands
      .trim();

    console.log('🧹 Cleaned LaTeX length:', coverLetter.length);
    console.log('🧹 First 200 chars after cleanup:', coverLetter.substring(0, 200));
    console.log('🧹 Last 200 chars after cleanup:', coverLetter.substring(coverLetter.length - 200));
    
    // Critical validation and fixes for common LaTeX issues
    if (!coverLetter.startsWith('\\documentclass')) {
      console.error('❌ Generated content does not start with \\documentclass');
      console.log('Full content:', coverLetter);
      throw new Error('Generated LaTeX content is malformed - missing document class');
    }

    // Check if document ends properly with \end{document}
    if (!coverLetter.includes('\\end{document}')) {
      console.error('❌ Missing \\end{document}');
      // Try to fix common malformations
      if (coverLetter.includes('\\end{document>')) {
        console.log('⚠️ Found malformed \\end{document> - fixing...');
        coverLetter = coverLetter.replace(/\\end\{document>/g, '\\end{document}');
      } else if (coverLetter.includes('end{document}')) {
        console.log('⚠️ Found end{document} without backslash - fixing...');
        coverLetter = coverLetter.replace(/([^\\])end\{document\}/g, '$1\\end{document}');
      } else {
        console.log('⚠️ \\end{document} is completely missing - appending...');
        coverLetter += '\n\n\\end{document}';
      }
    }

    // Ensure document ends with \end{document} and nothing else after it
    const endDocIndex = coverLetter.lastIndexOf('\\end{document}');
    if (endDocIndex !== -1) {
      coverLetter = coverLetter.substring(0, endDocIndex + 14); // Keep only up to \end{document}
    }

    console.log('✅ Cover letter validated and fixed successfully');
    console.log('🔍 Final last 100 chars:', coverLetter.substring(coverLetter.length - 100));

    // Save the generated letter to the database (this triggers stats update via database triggers)
    try {
      const { error: insertError } = await supabaseAdmin
        .from('generated_letters')
        .insert({
          user_id: user.id,
          job_description: jobDescription.substring(0, 10000), // Limit to prevent huge entries
          cover_letter: coverLetter
        });

      if (insertError) {
        console.error('⚠️ Failed to save generated letter to database:', insertError);
        // Don't fail the request, just log the error
      } else {
        console.log('💾 Letter saved to database successfully');
      }

      // Deduct one credit from user (skip for admin users)
      if (!isAdmin) {
        const newCredits = currentCredits - 1;
        const { error: creditError } = await supabaseAdmin
          .from('user_profiles')
          .update({ credits: newCredits })
          .eq('user_id', user.id);

        if (creditError) {
          console.error('⚠️ Failed to deduct credit:', creditError);
        } else {
          console.log(`💳 Credit deducted successfully. Remaining: ${newCredits}`);
        }
      } else {
        console.log('💳 Admin user - no credit deducted');
      }
    } catch (dbError) {
      console.error('⚠️ Database operation failed:', dbError);
      // Continue anyway - the letter was generated successfully
    }

    // Calculate remaining credits for response
    const remainingCredits = isAdmin ? -1 : (currentCredits - 1);

    return new Response(
      JSON.stringify({
        success: true,
        content: coverLetter,
        latex: coverLetter,
        credits: remainingCredits // -1 indicates unlimited (admin)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-cover-letter function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});