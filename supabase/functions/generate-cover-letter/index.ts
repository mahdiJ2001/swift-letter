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

    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials are not configured');
    }

    // AWS Bedrock configuration
    const region = "us-east-1";
    const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
    const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;

    // Create the prompt for Claude - generate complete LaTeX document using specific template
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
\\newcommand{\\targetSubject}{Application for \\targetPosition \\ at \\targetCompany}

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
To the Hiring Team at \\targetCompany,

I've been looking for a role where I can keep building in [Tech A] and [Tech B] but also get more hands-on with [Tech C]. When I saw the \\targetPosition \\ opening, it felt like a great match for what I'm looking for next. This is especially true since I've been wanting to move toward [specific goal] for a while now, and it's been a priority for me to find a team that's actually using this stack to solve real-world problems.

I actually just wrapped up a project involving [Project Name]. The main hurdle was [describe problem]. I tried a few different ways to solve it and eventually figured out that [fix] was the way to go. It took me a bit to get [specific part] working the way I wanted, but once that was sorted, it ended up [result]. I also picked up a lot regarding [specific skill] while I was at it, which has changed how I think about [relevant technical task].

The work you're doing at \\targetCompany \\ with [specific product/service] looks really interesting and it seems like a solid place to [career goal]. I'm the kind of developer who likes to understand how the whole puzzle fits together, so I think my background with [Tech A/B] would be pretty useful for the team. I'd be interested in chatting about what you have planned for the next few months and how I might be able to help out with the current roadmap.

Thanks for taking the time to look this over.

\\vspace{2.0em}

${language === 'french' ? 'Cordialement' : 'Sincerely'},\\\\
\\textbf{\\myname}

\\end{document}

CRITICAL INSTRUCTIONS:
1. Extract the job title and company name from the job description
2. Update ONLY these lines in the template:
   - \\newcommand{\\targetPosition}{[Replace with actual job title]}
   - \\newcommand{\\targetCompany}{[Replace with actual company name]}
3. Replace the letter body content (between "To the Hiring Team at \\targetCompany," and "Thanks for taking the time to look this over.") with personalized content following the EXACT template structure shown
4. Fill in the bracketed placeholders naturally and conversationally - DO NOT just copy-paste from the user profile. Instead:
   - [Tech A], [Tech B]: Use technologies the user has worked with, but mention them casually (e.g., "React stuff" instead of "React development")
   - [Tech C]: Pick a technology from the job description the user wants to learn more about
   - [specific goal]: Write a genuine career progression reason, not a corporate buzzword
   - [Project Name]: Use a real project name from the user's profile, or describe it naturally without formal titles
   - [describe problem]: Explain the actual technical challenge in simple terms, like you're talking to a friend
   - [fix]: Describe the solution conversationally, using phrases like "turned out" or "ended up working better"
   - [specific part]: Mention a technical detail that was tricky, using casual language
   - [result]: State the outcome naturally, avoid metrics unless they sound organic to the conversation
   - [specific skill]: Pick something the user learned that relates to the job, mention it casually
   - [relevant technical task]: Connect it to something in the job description, but make it sound like natural curiosity
   - [specific product/service]: Research the company and mention something specific they're working on
   - [career goal]: Make it about personal growth, not company benefits
5. Write ${language === 'french' ? 'in French' : 'in English'} using information from the user profile and job description
6. Keep ALL other LaTeX formatting, commands, and structure EXACTLY as shown
7. Do NOT add any extra LaTeX commands like \\noindent or \\vspace in the letter body
8. Write natural paragraphs following the template structure - the spacing is handled by the template structure
9. Do NOT use phrases like "I am confident that" - replace with more natural language like "I believe", "I think", or "it seems like"
10. CRITICAL: Never use single dashes (-) or double dashes (--) anywhere in the generated content - these are AI telltales
11. CRITICAL: Never use double quotes (") in the generated content - use single quotes (') instead to avoid revealing AI generation
12. CRITICAL: Always properly escape percentage symbols - write 96\\% not just 96 to ensure percentages display correctly in the final PDF

LANGUAGE REQUIREMENTS:
- Use casual phrases: "just wrapped up", "figured out", "the [tech] work", "pretty smoothly", "took me a while", "pretty much", "turned out", "ended up", "actually", "honestly"
- BANNED WORDS: "leverage", "cutting-edge", "scalable", "drive efficiency", "add value", "passionate about", "excited to", "utilize", "implement", "proficient", "expertise", "extensive experience"
- Say "figured out" not "implemented"
- Say "I'd be interested in" not "I would love to"
- Say "React stuff" not "React development"
- Say "working on" not "developing" or "building"
- Say "got into" not "learned" or "acquired skills in"
- Keep under 300 words total
- Technical details come from describing problems, not listing skills
- CRITICAL: ONLY use information that exists in the user's profile - DO NOT invent experiences, skills, projects, or details
- If the user profile lacks specific information for a placeholder, use generic terms or skip that detail entirely
- DO NOT create fictional project names, fake experiences, or made-up technical achievements
- DO NOT assume skills or technologies not explicitly mentioned in the user's profile
- Make it sound like a natural career progression, not forced
- Focus on genuine career growth motivations based only on provided information
- Sound like a normal person having a conversation, not writing a formal document
- Avoid obvious AI patterns like "With X years of experience in Y" or "My background in Z makes me a strong candidate"
- When mentioning technologies, integrate them naturally into problem descriptions rather than listing them
- Make connections between user experience and job requirements feel organic, not forced

CRITICAL OUTPUT FORMAT:
- Return ONLY the complete LaTeX document starting with \\documentclass
- Do NOT wrap in markdown code blocks (no \`\`\`latex or \`\`\`)
- Do NOT include any explanations or additional text
- Do NOT add \\noindent, \\vspace, or other LaTeX commands in the letter body
- The response must be pure, compilable LaTeX
- Escape special characters: % becomes \\%, & becomes \\&, # becomes \\#, $ becomes \\$, _ becomes \\_
- Never use single dashes (-) or double dashes (--) anywhere in the content
- Never use double quotes (") anywhere in the content - use single quotes (') instead
- Always escape percentages properly (e.g., 96\\% not 96) to display correctly in PDF

CRITICAL ANTI-AI DETECTION:
- Do NOT use formal business language or corporate buzzwords
- Do NOT structure sentences like "As a software developer with X years of experience..."
- Do NOT list qualifications or skills directly
- DO sound like a real person casually explaining their background
- DO use contractions (I've, I'd, it's, that's, etc.)
- DO use filler words occasionally (actually, honestly, pretty much)
- DO make it sound like you're talking to someone you know, not writing a formal letter
- DO let personality show through word choice and sentence structure

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
      .replace(/--/g, ' ') // Remove double dashes (AI telltale)
      .replace(/(?<!\\)-(?!\\)/g, ' ') // Remove single dashes not part of LaTeX commands
      .trim();

    console.log('🧹 Cleaned LaTeX length:', coverLetter.length);
    console.log('🧹 First 200 chars after cleanup:', coverLetter.substring(0, 200));
    
    // Validate that it starts with \\documentclass
    if (!coverLetter.startsWith('\\documentclass')) {
      console.error('❌ Generated content does not start with \\documentclass');
      console.log('Full content:', coverLetter);
      throw new Error('Generated LaTeX content is malformed - missing document class');
    }

    console.log('✅ Cover letter generated and validated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        content: coverLetter,
        latex: coverLetter
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