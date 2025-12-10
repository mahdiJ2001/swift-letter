export interface ExtractedResumeData {
    full_name?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    skills?: string | null
    experiences?: string | null
    projects?: string | null
    education?: string | null
    certifications?: string | null
    languages?: string | null
    linkedin?: string | null
    github?: string | null
    portfolio?: string | null
}

export async function extractResumeDataFromText(resumeText: string): Promise<ExtractedResumeData> {
    try {
        if (!resumeText || resumeText.trim().length === 0) {
            throw new Error('No resume text provided.')
        }
        
        // Call Supabase Edge Function to extract structured data
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing')
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/extract-profile-from-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ 
                pdfText: resumeText
            })
        })
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to extract data from resume')
        }
        
        return result.extractedData
    } catch (error) {
        console.error('Error in extractResumeDataFromText:', error)
        throw error
    }
}

export function formatSkillsArray(skills: string[] | string | null): string {
    if (!skills) return ''
    if (Array.isArray(skills)) {
        return skills.join(', ')
    }
    return skills
}

export function formatLanguagesArray(languages: string[] | string | null): string {
    if (!languages) return ''
    if (Array.isArray(languages)) {
        return languages.join(', ')
    }
    return languages
}