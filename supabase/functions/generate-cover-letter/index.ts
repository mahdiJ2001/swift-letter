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
You must create a complete LaTeX document that follows this exact structure. Fill in ALL bracketed placeholders with relevant information:

\\documentclass[letterpaper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}

% Manual page setup instead of fullpage package
\\setlength{\\oddsidemargin}{-0.5in}
\\setlength{\\evensidemargin}{-0.5in}
\\setlength{\\textwidth}{7.0in}
\\setlength{\\topmargin}{-0.75in}
\\setlength{\\textheight}{9.5in}
\\setlength{\\headheight}{0pt}
\\setlength{\\headsep}{0pt}
\\setlength{\\footskip}{0.5in}

% Remove page numbers
\\pagestyle{empty}

% Text alignment
\\raggedbottom
\\raggedright

\\begin{document}

\\noindent \\today

\\vspace{10pt}

\\noindent ${profile.full_name} \\\\
${profile.email} \\\\
${profile.linkedin ? profile.linkedin + ' \\\\' : ''}${profile.portfolio ? profile.portfolio + ' \\\\' : ''}

\\vspace{10pt}

${language === 'french' ? `\\\\noindent À l'équipe de recrutement de [Company's Name],

\\\\vspace{5pt}

\\\\noindent Je vous contacte au sujet du poste de [Job Title] chez [Company's Name]. J'ai travaillé sur [current work or recent focus from user profile], et quand j'ai découvert cette opportunité, j'ai tout de suite pensé que c'était exactement le genre de poste que je recherchais. [Brief personal connection or genuine interest in the role].

\\\\vspace{5pt}

\\\\noindent Ce poste me semble être une étape naturelle dans ma carrière. J'ai [mention current experience level or stage], et je suis vraiment intéressé par [specific aspect of the role that advances career]. Prendre en charge [specific responsibility from job description] serait un excellent moyen de [how it helps build their career or skills they want to develop].

\\\\vspace{5pt}

\\\\noindent [Mini-story about problem solved]. La partie la plus délicate était [specific technical challenge]. Cela m'a pris un certain temps pour comprendre [what you tried], mais une fois que j'ai [solution], tout s'est bien passé. Ce que j'ai appris de cette expérience était [key insight or skill gained].

\\\\vspace{5pt}

\\\\noindent Je suis tombé sur [specific company thing you found]. C'est exactement ce qui m'intéresse - [natural connection to your experience]. La partie [specific aspect] a particulièrement attiré mon attention parce que [personal reason why it matters to you].

\\\\vspace{5pt}

\\\\noindent D'après ce que je peux voir, vous recherchez quelqu'un qui peut [key requirement from job description]. C'est exactement le genre de travail que j'ai fait récemment, et je pense que je pourrais me rendre utile assez rapidement.

\\\\vspace{5pt}

\\\\noindent J'aimerais en savoir plus sur ce poste. N'hésitez pas à me contacter au ${profile.phone} ou ${profile.email}.

\\\\vspace{10pt}

\\\\noindent Cordialement, \\\\\\\\
\\\\vspace{5pt}
${profile.full_name}` : `\\\\noindent To the [Company's Name] hiring team,

\\\\vspace{5pt}

\\\\noindent I'm reaching out about the [Job Title] role at [Company's Name]. I've been [current work or recent focus from user profile], and when I came across this opening, it felt like exactly the kind of opportunity I've been looking for. [Brief personal connection or genuine interest in the role].

\\\\vspace{5pt}

\\\\noindent This role feels like a natural next step for me. I've been [mention current experience level or stage], and I'm really interested in [specific aspect of the role that advances career]. Taking on [specific responsibility from job description] would be a great way to [how it helps build their career or skills they want to develop].

\\\\vspace{5pt}

\\\\noindent [Mini-story about problem solved]. The trickiest part was [specific technical challenge]. Took me a while to figure out [what you tried], but once I [solution], it worked pretty smoothly. What I learned from that whole experience was [key insight or skill gained].

\\\\vspace{5pt}

\\\\noindent I came across [specific company thing you found]. That's pretty much what I'm interested in - [natural connection to your experience]. The [specific aspect] part especially caught my attention because [personal reason why it matters to you].

\\\\vspace{5pt}

\\\\noindent From what I can tell, you're looking for someone who can [key requirement from job description]. That's exactly the kind of work I've been doing lately, and I think I could jump in and be useful pretty quickly.

\\\\vspace{5pt}

\\\\noindent I'd be interested in talking more about the role. Feel free to reach me at ${profile.phone} or ${profile.email}.

\\\\vspace{10pt}

\\\\noindent Thanks for your time, \\\\\\\\
\\\\vspace{5pt}
${profile.full_name}`}

\\end{document}

INSTRUCTIONS:
1. Extract job title and company name from job description
2. Fill in [current work or recent focus from user profile] - What they're currently doing based ONLY on their profile info
3. Fill in [Brief personal connection or genuine interest in the role] - Why this specific role caught their attention
4. Fill in [current experience level or stage] - Where they are in their career based ONLY on user profile
5. Fill in [specific aspect of the role that advances career] - What part of the job helps them grow
6. Fill in [specific responsibility from job description] - Key responsibility from the job posting
7. Fill in [how it helps build their career or skills they want to develop] - Career benefit this role provides
8. Fill in [Mini-story about problem solved] - Tell actual story of real problem they solved using casual language
9. Fill in [specific technical challenge] - The hardest part of the problem
10. Fill in [what you tried] - What approaches you attempted first
11. Fill in [solution] - How you actually solved it, mention tech naturally (e.g., "built the frontend in Angular" not "Angular skills")
12. Fill in [key insight or skill gained] - What you learned from solving that problem
13. Fill in [specific company thing you found] - ONE real thing about company (blog post, GitHub repo, product update, news). Use phrases like "your recent blog post about X" or "you just shipped Y feature"
14. Fill in [natural connection to your experience] - Connect it casually like "Same kind of problem I dealt with" or "That's the work I've been doing"
15. Fill in [specific aspect] - Specific part of what you found about the company
16. Fill in [personal reason why it matters to you] - Why that specific thing interests you personally
17. Fill in [key requirement from job description] - Main thing they're looking for in the role

LANGUAGE REQUIREMENTS:
- Use casual phrases: "just wrapped up", "figured out", "the [tech] work", "pretty smoothly", "took me a while", "pretty much"
- BANNED WORDS: "leverage", "cutting-edge", "scalable", "drive efficiency", "add value", "passionate about", "excited to", "utilize", "implement"
- Say "figured out" not "implemented"
- Say "I'd be interested in" not "I would love to"
- Keep under 300 words total (longer template now)
- Technical details come from describing problems, not listing skills
- ONLY use information that exists in the user's profile - DO NOT invent experiences, skills, or details
- Make it sound like a natural career progression, not forced
- Focus on genuine career growth motivations
- Sound like a normal person, not a robot



CRITICAL: Return ONLY the complete LaTeX document. Do not include any explanations, markdown formatting, or additional text. The response must be valid LaTeX that can be compiled directly.

IMPORTANT: When writing percentages, always use \\% instead of % to avoid LaTeX compilation errors. Also escape other special characters: & becomes \\&, # becomes \\#, $ becomes \\$, _ becomes \\_`;

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
    const coverLetter = responseBody.content[0].text;

    console.log('✅ Cover letter generated successfully');

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