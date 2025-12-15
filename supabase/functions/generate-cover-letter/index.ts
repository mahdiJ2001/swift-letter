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
To the Hiring Team at \\targetCompany,

I've been looking for a role where I can keep building in [Tech A] and [Tech B] but also get more hands-on with [Tech C]. When I saw the \\targetPosition \\ opening, it felt like a great match for what I'm looking for next. This is especially true since I've been wanting to move toward [specific goal] for a while now, and it's been a priority for me to find a team that's actually using this stack to solve real-world problems.

I've been working on some projects that actually align pretty well with what you're looking for. I just wrapped up [Most Recent Project by Date] where I [brief description and key tech], and before that I worked on [Older Project by Date] which involved [brief description and different key tech]. The [Most Recent Project] project taught me [specific skill/insight], while the [Older Project] work really helped me understand [different skill/insight]. Both experiences have given me a solid foundation in [combined relevant technologies].

The work you're doing at \\targetCompany \\ with [specific product/service] looks really interesting and it seems like a solid place to [career goal]. I'm the kind of developer who likes to understand how the whole puzzle fits together, so I think my background with [Tech A/B/C] would be pretty useful for the team. I'd be interested in chatting about what you have planned for the next few months and how I might be able to help out with the current roadmap.

Thanks for taking the time to look this over.

\\vspace{2.0em}

${language === 'french' ? 'Cordialement' : 'Sincerely'},\\\\
\\textbf{\\myname}

\\end{document}

CRITICAL INSTRUCTIONS:
0. MANDATORY PROJECT OPTIMIZATION: Before selecting projects, calculate which 2-3 project combination covers the MAXIMUM number of job requirements. DO NOT proceed without this calculation.
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
   - Say "When I saw the [position] opening" or "When I saw your [position] role opening" instead of copying technical specifications
   - Use clean job titles without parentheses or technical details in the letter content
7. PROJECT SELECTION INTELLIGENCE - MANDATORY COVERAGE OPTIMIZATION:
   - STEP 1: Extract ALL required technologies from job description: [Tech1, Tech2, Tech3, etc.]
   - STEP 2: Map each project to its technologies: Project A → [TechX, TechY], Project B → [TechZ, TechW], etc.
   - STEP 3: CALCULATE COVERAGE for all possible 2-3 project combinations:
     * Combination 1: Project A + Project B = covers [list unique techs] = X% of job requirements
     * Combination 2: Project A + Project C = covers [list unique techs] = Y% of job requirements
     * Continue for all combinations...
   - STEP 4: SELECT the combination with HIGHEST coverage percentage
   - STEP 5: If tied, choose combination with LEAST overlapping technologies
   - STEP 6: MANDATORY DATE VERIFICATION - Check project dates/timeline from user profile and sort selected projects chronologically (newest first, oldest last)
   - STEP 7: ASSIGN TEMPORAL LANGUAGE - Most recent project gets "just wrapped up", older projects get "before that" or "previously"
   - MANDATORY RULE: NEVER select projects with identical tech stacks when other combinations provide better coverage
   - CHRONOLOGICAL RULE: ALWAYS verify project dates before assigning temporal language. NEVER guess chronological order.
   - COVERAGE FORMULA: (Number of unique job requirements covered ÷ Total job requirements) × 100%
   - FAILURE PREVENTION: Before finalizing selection, verify that chosen projects cover MORE job requirements than any other possible combination
   - TEMPORAL VERIFICATION: Ensure project order in letter matches actual chronological sequence
   - EXAMPLE: Job needs [Java, Angular, AWS]. Project A (Java+Angular) + Project C (AWS+Python) covers 100% vs Project A (Java+Angular) + Project B (Java+Spring) covers 67%. ALWAYS choose the 100% option.
8. Write ${language === 'french' ? 'in French' : 'in English'} using information from the user profile and job description
9. Keep ALL other LaTeX formatting, commands, and structure EXACTLY as shown
10. Do NOT add any extra LaTeX commands like \\noindent or \\vspace in the letter body
11. STRICT TEMPLATE RULE: Follow the exact three-paragraph structure provided. Do not add extra paragraphs, combine paragraphs, or change the sentence flow within each paragraph.
12. Write natural paragraphs following the template structure - the spacing is handled by the template structure
13. Do NOT use phrases like "I am confident that" - replace with more natural language like "I believe", "I think", or "it seems like"
14. CRITICAL: Never use single dashes (-) or double dashes (--) anywhere in the generated content - these are AI telltales
15. CRITICAL: Always properly escape percentage symbols - write 96\\% not just 96 to ensure percentages display correctly in the final PDF

LANGUAGE REQUIREMENTS:
- Use casual phrases: "just wrapped up", "figured out", "the [tech] work", "pretty smoothly", "took me a while", "pretty much", "turned out", "ended up", "actually", "honestly"
- BANNED WORDS: "leverage", "cutting-edge", "scalable", "drive efficiency", "add value", "passionate about", "excited to", "utilize", "implement", "proficient", "expertise", "extensive experience"
- Say "figured out" not "implemented"
- Say "I'd be interested in" not "I would love to"
- Say "React stuff" not "React development"
- Say "working on" not "developing" or "building"
- Say "got into" not "learned" or "acquired skills in"
- Keep under 400 words total
- Technical details come from describing problems, not listing skills

PROJECT SELECTION RULES:
- CRITICAL: NEVER MIX PROJECT DETAILS - Each project must keep its own technologies, tools, and experiences separate. Do NOT combine technologies from different projects into one project description
- COMPREHENSIVE ANALYSIS: Carefully analyze the ENTIRE job description and identify ALL required technologies, not just the first few mentioned
- COMPLETE PROJECT REVIEW: Review ALL projects in the user's profile and create a technology-to-project mapping before writing
- INTELLIGENT COVERAGE OPTIMIZATION: 
  * Step 1: List all required technologies from job description
  * Step 2: For each project, list its technologies
  * Step 3: Find the combination of 2-3 projects that covers the MAXIMUM number of different required technologies
  * Step 4: Avoid selecting projects with overlapping tech stacks when other projects could provide better coverage
- COMPLEMENTARY SELECTION: Choose projects that complement each other's technology coverage rather than duplicating technologies
- TECHNOLOGY ACCURACY: Each technology mentioned must come from the correct project where it was actually used
- COVERAGE PRIORITIZATION: Prioritize covering different technology areas (backend + frontend + cloud) over multiple projects in the same area
- PROJECT-SPECIFIC DETAILS: When describing a project, only mention technologies, challenges, and solutions that actually belong to that specific project
- MANDATORY DATE EXTRACTION: Extract or identify project dates/timeline from the user profile BEFORE writing anything
- CHRONOLOGICAL ORDERING: Sort selected projects by actual completion date (most recent first) - do NOT guess or assume chronological order
- TEMPORAL ACCURACY: The project with the LATEST date gets "just wrapped up", earlier dated projects get "before that" - verify this before writing
- VERIFICATION STEP: Before finalizing the letter, verify that each mentioned technology is correctly attributed to the right project AND that the selected projects provide optimal coverage of job requirements AND that chronological order is respected
- FINAL COVERAGE CHECK: Before writing, confirm that selected projects cover MORE job requirements than any other possible combination - if not, CHANGE the selection to the optimal combination
- FINAL CHRONOLOGICAL CHECK: Before completing the letter, verify that "just wrapped up" refers to the most recent project and "before that" refers to older projects. If dates are unclear from profile, use neutral temporal language.

TEMPLATE ADHERENCE RULES:
- NEVER deviate from the three-paragraph structure provided
- NEVER add introductory sentences before the template content
- NEVER add concluding sentences after the template content
- NEVER merge or split the provided paragraphs
- NEVER change the opening line "I've been looking for a role where I can keep building in [Tech A] and [Tech B]..."
- ALWAYS use the multiple projects approach for the second paragraph: "I've been working on some projects that actually align pretty well with what you're looking for..."
- NEVER change the third paragraph opening "The work you're doing at [Company] with [specific product/service]..."
- ONLY fill in the bracketed placeholders with natural, conversational content
- Reference 2-3 most relevant projects, each with their accurate technologies and specific contributions
- CHRONOLOGICAL LANGUAGE RULES:
  * Most recent project: "I just wrapped up [Project A]" or "I recently finished [Project A]"
  * Older project: "and before that I worked on [Project B]" or "previously I worked on [Project B]"
  * NEVER say "before that" when referring to a more recent project
  * Ensure temporal language matches actual project timeline

CRITICAL: ONLY use information that exists in the user's profile - DO NOT invent experiences, skills, projects, or details
- If the user profile lacks specific information for a placeholder, use generic terms or skip that detail entirely
- DO NOT create fictional project names, fake experiences, or made-up technical achievements
- DO NOT assume skills or technologies not explicitly mentioned in the user's profile
- Make it sound like a natural career progression, not forced
- Focus on genuine career growth motivations based only on provided information
- Sound like a normal person having a conversation, not writing a formal document
- Avoid obvious AI patterns like "With X years of experience in Y" or "My background in Z makes me a strong candidate"
- When mentioning technologies, integrate them naturally into problem descriptions rather than listing them
- Make connections between user experience and job requirements feel organic, not forced

CRITICAL PROJECT ACCURACY RULES:
- NEVER mix technologies from different projects - if Project A used React and Project B used Angular, do NOT mention both in the same project description
- NEVER combine challenges or solutions from different projects into one project narrative
- If describing one specific project, ONLY mention technologies, tools, and experiences that belong to that exact project
- If job requirements need coverage of multiple technology areas, use multiple project references rather than mixing project details
- Before writing about any project, verify which specific technologies were used in that project according to the user's profile
- If uncertain about which project used which technology, do NOT guess - use generic descriptions instead

OPTIMAL PROJECT SELECTION STRATEGY:
- GOAL: Select projects whose combined technologies cover the maximum number of job requirements
- MANDATORY STEP-BY-STEP PROCESS:
  1. List job requirements: [Java, Angular, AWS]
  2. Calculate coverage for each possible combination:
     - Project A (Java, Angular) + Project B (Java, Spring) = covers 2/3 requirements (Java ✓, Angular ✓, AWS ✗)
     - Project A (Java, Angular) + Project C (AWS, Python) = covers 3/3 requirements (Java ✓, Angular ✓, AWS ✓)
     - Project B (Java, Spring) + Project C (AWS, Python) = covers 2/3 requirements (Java ✓, Angular ✗, AWS ✓)
  3. ALWAYS choose the combination with HIGHEST coverage percentage
  4. ARRANGE selected projects by chronological order (newest first, oldest last)
- CRITICAL RULE: If multiple combinations have same coverage, choose the one with LEAST technology overlap
- CHRONOLOGICAL RULE: In the letter, describe projects in temporal order - newest as "just wrapped up", older as "before that"
- BAD EXAMPLE: Job needs (Java, Angular, AWS) → Selecting Project A (Java, Angular) + Project B (Java, Spring) = only 67% coverage
- GOOD EXAMPLE: Job needs (Java, Angular, AWS) → Selecting Project A (Java, Angular) + Project C (AWS, Python) = 100% coverage
- COVERAGE CALCULATION: Count unique job requirements covered ÷ total job requirements × 100%
- TEMPORAL ACCURACY: Verify project dates to ensure "just wrapped up" refers to the most recent project

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