import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Import AWS SDK for Bedrock
const { BedrockRuntimeClient, InvokeModelCommand } = await import("npm:@aws-sdk/client-bedrock-runtime")

// Declare Deno global for TypeScript
declare const Deno: {
    env: {
        get(name: string): string | undefined;
    };
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const requestBody = await req.json()
        console.log('Received request body keys:', Object.keys(requestBody))

        const { pdfText } = requestBody

        if (!pdfText || pdfText.trim().length < 50) {
            return new Response(
                JSON.stringify({ error: 'PDF text is required and must be at least 50 characters' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('Processing PDF text with AI, length:', pdfText.length)

        // Create the AI prompt for extracting profile information
        const prompt = `You are an expert at extracting structured information from resumes with advanced pattern recognition.
    
Please analyze the following resume text and extract comprehensive information in JSON format. 
Extract all relevant information present in the text, using intelligent parsing for complex layouts.
Use null for any fields that cannot be determined with confidence.

Resume text:
${pdfText}

Please extract and return a JSON object with the following structure:
{
  "full_name": "string or null (prioritize names at document top)",
  "email": "string or null (extract valid email addresses)", 
  "phone": "string or null (extract phone numbers in any format)",
  "location": "string or null (city, state/country format preferred)",
  "skills": "string or null (comma-separated list of technical and soft skills)",
  "experiences": "string or null (complete work experience section with formatting)",
  "projects": "string or null (all projects section with descriptions)", 
  "education": "string or null (education section with degrees and institutions)",
  "certifications": "string or null (certifications and licenses section)",
  "languages": "string or null (comma-separated list of spoken languages)",
  "linkedin": "string or null (LinkedIn profile URL if found)",
  "github": "string or null (GitHub profile URL if found)",
  "portfolio": "string or null (Portfolio/website URL if found)"
}

Enhanced extraction guidelines:
- SKILLS: Extract technical skills, programming languages, frameworks, tools, platforms, and relevant soft skills as a comma-separated string
- EXPERIENCES: Capture complete work history with job titles, companies, dates, and key accomplishments
- PROJECTS: Include project names, technologies used, and brief descriptions
- EDUCATION: Extract degrees, institutions, graduation dates, relevant coursework
- CERTIFICATIONS: Include professional certifications, licenses, and relevant training
- LOCATION: Prefer "City, State" or "City, Country" format
- LINKS: Extract LinkedIn, GitHub, and portfolio URLs from the resume
- Be thorough but accurate - include all relevant professional information found
- Preserve original formatting and structure where possible
- Return ONLY valid JSON, no additional text or explanation`

        // Initialize AWS SDK
        const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
        const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

        if (!accessKeyId || !secretAccessKey) {
            console.log('Error: Missing AWS credentials')
            return new Response(
                JSON.stringify({ error: 'AWS credentials not configured' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const client = new BedrockRuntimeClient({
            region: 'us-east-1',
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        })

        // Use Claude 3 Haiku (cheapest model that's still accurate)
        const params = {
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: new TextEncoder().encode(JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1
            }))
        }

        console.log('Calling Bedrock API for PDF parsing with Claude 3 Haiku...')

        const command = new InvokeModelCommand(params)

        // Add timeout protection to prevent broken pipe errors
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
        })

        const response = await Promise.race([
            client.send(command),
            timeoutPromise
        ]) as any

        const responseBody = JSON.parse(new TextDecoder().decode(response.body))
        console.log('Bedrock response:', responseBody)

        let extractedData
        try {
            // Parse the AI response to extract JSON
            const aiResponse = responseBody.content[0].text
            console.log('AI response text:', aiResponse)

            // Try to extract JSON from the response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0])
            } else {
                // If no JSON block found, try to parse the entire response
                extractedData = JSON.parse(aiResponse.trim())
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError)
            return new Response(
                JSON.stringify({
                    error: 'Failed to parse AI response',
                    details: parseError instanceof Error ? parseError.message : 'Unknown error'
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('Extracted profile data:', extractedData)

        return new Response(
            JSON.stringify(extractedData),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error in extract-profile-from-pdf:', error)

        // Handle specific error types
        let errorMessage = 'Internal server error'
        let statusCode = 500
        const errorMsg = error instanceof Error ? error.message : String(error)

        if (errorMsg.includes('Unexpected end of JSON input') || errorMsg.includes('JSON')) {
            errorMessage = 'Invalid request format'
            statusCode = 400
        } else if (errorMsg.includes('timeout')) {
            errorMessage = 'Request timeout - please try with a smaller PDF or try again'
        } else if (errorMsg.includes('broken pipe')) {
            errorMessage = 'Connection interrupted - please try again'
        } else if (errorMsg.includes('model')) {
            errorMessage = 'AI model temporarily unavailable - please try again'
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: errorMsg
            }),
            {
                status: statusCode,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})