'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Send, Globe, Download, X, Pencil, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

type UserProfile = {
    id: string
    full_name: string
    email: string
    phone: string
    links?: string
    experiences: string
    projects: string
    skills: string
    education?: string
    certifications?: string
    languages?: string
    location?: string
    credits: number
    linkedin?: string
    github?: string
    portfolio?: string
    writing_style?: string
}

export default function JobDescriptionForm() {
    const [jobDescription, setJobDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [generatedLetter, setGeneratedLetter] = useState('')
    const [generatedLatex, setGeneratedLatex] = useState('')
    const [isPdfGenerating, setIsPdfGenerating] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPdfPreview, setShowPdfPreview] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const [selectedLanguage, setSelectedLanguage] = useState('english')
    const [showLanguageModal, setShowLanguageModal] = useState(false)
    const [isEditingLetter, setIsEditingLetter] = useState(false)
    const [editableLetter, setEditableLetter] = useState('')
    const [editableRecipientName, setEditableRecipientName] = useState('')
    const [editableCompany, setEditableCompany] = useState('')
    const [editablePosition, setEditablePosition] = useState('')
    const [editableSubject, setEditableSubject] = useState('')
    const [originalLatexBody, setOriginalLatexBody] = useState('')
    const [isUploadingResume, setIsUploadingResume] = useState(false)
    const [hasResumeAttached, setHasResumeAttached] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    // Fetch user profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setHasResumeAttached(false)
                return
            }

            try {
                const response = await fetch(`/api/profile?userId=${user.id}`)
                if (response.ok) {
                    const profileData = await response.json()
                    const hasProfile = profileData &&
                        profileData.full_name &&
                        profileData.experiences &&
                        profileData.skills
                    setHasResumeAttached(hasProfile)
                    if (profileData) {
                        setProfile(profileData)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error)
            }
        }

        fetchProfile()
    }, [user])

    // Prevent body scrolling when modals are open
    useEffect(() => {
        const isAnyModalOpen = showPdfPreview || showLanguageModal || isEditingLetter

        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [showPdfPreview, showLanguageModal, isEditingLetter])

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file.')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.')
            return
        }

        setIsUploadingResume(true)
        setError('')
        setSuccess('Processing resume...')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Failed to process PDF')
            }

            const responseData = await response.json()
            const extractedData = responseData.data

            const { formatSkillsArray, formatLanguagesArray } = await import('@/lib/resume-parser')

            const updatedProfile = {
                full_name: extractedData.full_name || '',
                email: extractedData.email || '',
                phone: extractedData.phone || '',
                location: extractedData.location || '',
                experiences: extractedData.experiences || '',
                projects: extractedData.projects || '',
                skills: formatSkillsArray(extractedData.skills || null) || '',
                education: extractedData.education || '',
                certifications: extractedData.certifications || '',
                languages: formatLanguagesArray(extractedData.languages || null) || '',
                links: [
                    extractedData.linkedin ? `LinkedIn: ${extractedData.linkedin}` : '',
                    extractedData.github ? `GitHub: ${extractedData.github}` : '',
                    extractedData.portfolio ? `Portfolio: ${extractedData.portfolio}` : ''
                ].filter(Boolean).join('\n')
            }

            if (user) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    const checkResponse = await fetch(`/api/profile?userId=${user.id}`)
                    let existingProfile = null
                    let hasExistingProfile = false

                    if (checkResponse.ok) {
                        const profileData = await checkResponse.json()
                        if (profileData && profileData.id) {
                            existingProfile = profileData
                            hasExistingProfile = true
                        }
                    }

                    const updateResponse = await fetch('/api/profile', {
                        method: hasExistingProfile ? 'PUT' : 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            ...updatedProfile,
                            ...(hasExistingProfile && existingProfile?.id ? { id: existingProfile.id } : {})
                        })
                    })

                    if (updateResponse.ok) {
                        const savedProfile = await updateResponse.json()
                        setProfile(savedProfile)
                        setHasResumeAttached(true)
                        setSuccess('Resume processed successfully!')
                        setTimeout(() => setSuccess(''), 3000)
                    }
                }
            }

            event.target.value = ''
        } catch (error: any) {
            setError(error.message || 'Failed to process resume.')
            setTimeout(() => setError(''), 5000)
        } finally {
            setIsUploadingResume(false)
        }
    }

    const handleGenerateCoverLetter = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!jobDescription.trim()) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        if (!user) {
            router.push('/auth/login?redirectTo=/')
            return
        }

        try {
            const response = await fetch(`/api/profile?userId=${user.id}`)
            if (!response.ok) {
                sessionStorage.setItem('jobDescription', jobDescription)
                router.push('/profile')
                return
            }

            const profileData = await response.json()

            if (!profileData || !profileData.full_name || !profileData.email || !profileData.phone || !profileData.experiences || !profileData.skills) {
                sessionStorage.setItem('jobDescription', jobDescription)
                router.push('/profile')
                return
            }

            setProfile(profileData)
            await generateCoverLetter(profileData)

        } catch (error) {
            console.error('Error checking profile:', error)
            setError('Failed to check profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const generateCoverLetter = async (profileData: UserProfile) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No valid session found')
            }

            const generateResponse = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    profile: {
                        full_name: profileData.full_name,
                        email: profileData.email,
                        phone: profileData.phone,
                        location: profileData.location,
                        linkedin: profileData.linkedin,
                        github: profileData.github,
                        portfolio: profileData.portfolio,
                        experiences: profileData.experiences,
                        projects: profileData.projects,
                        skills: profileData.skills,
                        education: profileData.education,
                        certifications: profileData.certifications,
                        languages: profileData.languages
                    },
                    jobDescription,
                    language: selectedLanguage,
                    generationMode: 'polished'
                })
            })

            if (!generateResponse.ok) {
                const errorData = await generateResponse.json()
                throw new Error(errorData.error || 'Failed to generate cover letter')
            }

            const data = await generateResponse.json()

            if (data.success) {
                setGeneratedLetter(data.content)
                setGeneratedLatex(data.latex)

                // Extract fields for editing
                const companyMatch = data.content.match(/\\newcommand\{\\targetCompany\}\{([^}]*)\}/)
                const positionMatch = data.content.match(/\\newcommand\{\\targetPosition\}\{([^}]*)\}/)
                const subjectMatch = data.content.match(/\\newcommand\{\\targetSubject\}\{([^}]*)\}/)
                const recipientMatch = data.content.match(/\\newcommand\{\\recipientName\}\{([^}]*)\}/)

                const extractedCompany = companyMatch?.[1]?.replace(/\\&/g, '&').trim() || ''
                const extractedPosition = positionMatch?.[1]?.replace(/\\&/g, '&').trim() || ''
                let extractedSubject = subjectMatch?.[1] || ''

                if (extractedSubject) {
                    extractedSubject = extractedSubject
                        .replace(/\\targetPosition(?![a-zA-Z])/g, extractedPosition)
                        .replace(/\\targetCompany(?![a-zA-Z])/g, extractedCompany)
                        .replace(/\\&/g, '&')
                        .trim()
                } else {
                    extractedSubject = `Application for ${extractedPosition} at ${extractedCompany}`
                }

                setEditableCompany(extractedCompany)
                setEditablePosition(extractedPosition)
                setEditableSubject(extractedSubject)
                setEditableRecipientName(recipientMatch?.[1] || '')

                // Extract the actual letter content between \begin{document} and \end{document}
                // and remove LaTeX commands for better editing
                let extractedBody = ''

                // Debug: Log the raw content to see what we're working with
                console.log('Raw LaTeX content (first 1000 chars):', data.content.substring(0, 1000))

                // Extract the letter body with improved pattern matching for editing
                let rawLatexBody = ''

                // First extract raw LaTeX body for reconstruction
                const rawBodyMatch = data.content.match(/(?:To the\s+(?:[^,\n]+|\\targetCompany\\\s*)hiring team,|Dear\s+(?:[^,\n]+|\\recipientName)\s*,)\s*(?:\\\\\s*)?\n([\s\S]*?)(?=\n\s*\\vspace\{2\.0em\})/i)
                if (rawBodyMatch && rawBodyMatch[1]) {
                    rawLatexBody = rawBodyMatch[1].trim()
                }

                // Simplified patterns for clean text extraction
                const patterns = [
                    // Pattern 1: Most reliable - between greeting and \vspace{2.0em}
                    /(?:To the\s+(?:[^,\n]+|\\targetCompany\\\s*)hiring team,|Dear\s+(?:[^,\n]+|\\recipientName)\s*,)\s*(?:\\\\\s*)?\n([\s\S]*?)(?=\n\s*\\vspace\{2\.0em\})/i,
                    // Pattern 2: Between greeting and signature
                    /(?:To the|Dear)\s+[^,\n]*,\s*(?:\\\\\s*)?\n([\s\S]*?)(?=\n\s*(?:Sincerely|Cordialement))/i,
                    // Pattern 3: Fallback for any greeting pattern
                    /(?:Dear|To the)\s+[^,\n]*,\s*(?:\\\\\s*)?\n([\s\S]*?)(?=\n\s*\\[a-zA-Z]|\\end\{document\})/i
                ]

                for (let i = 0; i < patterns.length; i++) {
                    const match = data.content.match(patterns[i])
                    if (match && match[1] && match[1].trim()) {
                        console.log(`Pattern ${i + 1} matched, extracting content...`)

                        // Get raw LaTeX content - this contains blank lines between paragraphs
                        let rawContent = match[1]

                        console.log('Raw LaTeX content (first 500 chars):')
                        console.log(rawContent.substring(0, 500))

                        // Process content to ensure proper paragraph spacing for edit field
                        extractedBody = rawContent
                            // Step 1: Handle LaTeX special characters
                            .replace(/\\&/g, '&')
                            .replace(/\\%/g, '%')
                            .replace(/\\ /g, ' ')
                            .replace(/\\\$/g, '$')
                            .replace(/\\#/g, '#')
                            .replace(/\\~/g, '~')
                            .replace(/\\_/g, '_')

                            // Step 2: Replace LaTeX variables with actual values
                            .replace(/\\targetPosition\\/g, extractedPosition || 'the position')
                            .replace(/\\targetPosition(?![a-zA-Z])/g, extractedPosition || 'the position')
                            .replace(/\\targetCompany\\/g, extractedCompany || 'your company')
                            .replace(/\\targetCompany(?![a-zA-Z])/g, extractedCompany || 'your company')
                            .replace(/\\recipientName\\/g, recipientMatch?.[1] || 'Hiring Manager')
                            .replace(/\\recipientName(?![a-zA-Z])/g, recipientMatch?.[1] || 'Hiring Manager')

                            // Step 3: Remove LaTeX formatting commands but keep text content
                            .replace(/\\textbf\{([^}]*)\}/g, '$1')
                            .replace(/\\textit\{([^}]*)\}/g, '$1')
                            .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')

                            // Step 4: Remove other LaTeX commands
                            .replace(/\\vspace\{[^}]*\}/g, '')
                            .replace(/\\[a-zA-Z]+\*?\{[^}]*\}/g, '')
                            .replace(/\\[a-zA-Z]+\*?(?![a-zA-Z])/g, '')
                            .replace(/\{([^}]*)\}/g, '$1')

                            // Step 5: CRITICAL - Ensure proper paragraph spacing for edit field
                            // Strategy: Identify paragraph boundaries and ensure blank lines between them
                            .replace(/\n\s*\n\s*\n+/g, '\n\n')   // Normalize multiple blank lines to single blank line
                            .replace(/^\s+|\s+$/g, '')           // Trim only leading/trailing whitespace

                        console.log('After LaTeX cleanup, before paragraph formatting:')
                        console.log('---RAW-CLEANED---')
                        console.log(JSON.stringify(extractedBody.substring(0, 200)))
                        console.log('---END-RAW---')

                        // FORCE proper paragraph formatting for edit field
                        // Split content into sentences/logical breaks and create proper paragraphs
                        extractedBody = extractedBody
                            // First, normalize all line breaks to spaces to get clean text
                            .replace(/\n+/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            // Then split on sentence patterns that indicate new paragraphs
                            .split(/\.\s+(?=[A-Z])/g)  // Split on periods followed by capital letters
                            .map(sentence => sentence.trim())
                            .filter(sentence => sentence)
                            .map(sentence => sentence.endsWith('.') ? sentence : sentence + '.')
                            .join('\n\n')  // Join with blank lines between sentences/paragraphs

                        console.log('Final formatted content for edit field:')
                        console.log('---FINAL-EDIT-CONTENT---')
                        console.log(JSON.stringify(extractedBody))
                        console.log('---END-FINAL---')

                        break
                    }
                }

                // Store raw LaTeX body for PDF reconstruction 
                setOriginalLatexBody(rawLatexBody)

                // Fallback extraction if patterns failed
                if (!extractedBody) {
                    console.warn('Primary patterns failed, trying fallback extraction')
                    // Simple fallback - extract content between greeting and signature
                    const fallbackMatch = data.content.match(/(?:Dear|To the)[^,\n]*,\s*(?:\\\\\s*)?\n([\s\S]{50,}?)(?=\n\s*(?:Sincerely|Cordialement|\\\vspace))/i)
                    if (fallbackMatch && fallbackMatch[1]) {
                        extractedBody = fallbackMatch[1]
                            .replace(/\\[a-zA-Z]+\*?\{[^}]*\}/g, '')
                            .replace(/\\[a-zA-Z]+\*?(?![a-zA-Z])/g, '')
                            .replace(/\{([^}]*)\}/g, '$1')
                            // Preserve paragraph spacing - normalize to single blank lines
                            .replace(/\n{3,}/g, '\n\n')
                            .trim()
                    }
                }

                // Final fallback
                if (!extractedBody) {
                    console.error('All extraction methods failed')
                    extractedBody = 'Generated content will appear here'
                }

                console.log('Final content to edit:', extractedBody.length, 'characters')
                setEditableLetter(extractedBody)

                await generatePdfAndPreview(data.latex)
            } else {
                throw new Error(data.error || 'Failed to generate cover letter')
            }

        } catch (error: any) {
            console.error('Error generating cover letter:', error)
            setError(error.message || 'Failed to generate cover letter. Please try again.')
        }
    }

    const generatePdfFromText = async (textContent: string, recipientName: string = '', companyName: string = '', positionName: string = '', subjectText: string = '') => {
        setIsPdfGenerating(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No valid session found')
            }

            const targetCompany = companyName || 'Company'
            const targetPosition = positionName || 'Position'
            const targetRecipient = recipientName || 'Hiring Manager'
            const targetSubject = subjectText || `Application for ${targetPosition} at ${targetCompany}`

            const formattedLatex = generatedLatex
                .replace(/\\newcommand\{\\recipientName\}\{[^}]*\}/g, `\\newcommand{\\recipientName}{${targetRecipient}}`)
                .replace(/\\newcommand\{\\targetCompany\}\{[^}]*\}/g, `\\newcommand{\\targetCompany}{${targetCompany}}`)
                .replace(/\\newcommand\{\\targetPosition\}\{[^}]*\}/g, `\\newcommand{\\targetPosition}{${targetPosition}}`)
                .replace(/\\newcommand\{\\targetSubject\}\{[^}]*\}/g, `\\newcommand{\\targetSubject}{${targetSubject}}`)

            // Replace the letter body content with the edited text
            // Match content between greeting and "\vspace{2.0em}" which is the actual letter body
            // The greeting format is "To the \targetCompany\ hiring team," 

            // WYSIWYG approach: convert edited text back to LaTeX with MINIMAL changes
            // The goal is to preserve the exact spacing the user sees in the edit field
            console.log('WYSIWYG conversion - preserving exact spacing from edit field')
            console.log('Original text content:')
            console.log('---EDIT-FIELD-INPUT---')
            console.log(textContent)
            console.log('---END---')

            const latexFormattedContent = textContent
                // Only escape LaTeX special characters - do NOT modify spacing structure
                .replace(/\\\\/g, '\\textbackslash{}')  // Handle backslashes first
                .replace(/&/g, '\\&')                   // Escape & for LaTeX  
                .replace(/%/g, '\\%')                   // Escape % for LaTeX
                .replace(/\$/g, '\\$')                  // Escape $ for LaTeX
                .replace(/#/g, '\\#')                   // Escape # for LaTeX
                .replace(/_/g, '\\_')                   // Escape _ for LaTeX
                .replace(/\^/g, '\\textasciicircum{}')  // Escape ^ for LaTeX
                .replace(/~/g, '\\textasciitilde{}')    // Escape ~ for LaTeX
                .replace(/\{/g, '\\{')                  // Escape { for LaTeX
                .replace(/\}/g, '\\}')                  // Escape } for LaTeX
            // PRESERVE SPACING EXACTLY AS USER TYPED IT - no paragraph manipulation

            console.log('Final LaTeX content (should match edit field spacing):')
            console.log('---LATEX-OUTPUT---')
            console.log(latexFormattedContent)
            console.log('---END---')

            let finalLatex = formattedLatex

            console.log('Replacing letter body content with edited text...')

            // Find and replace the letter body content with proper spacing preservation
            // Pattern 1: Look for the specific greeting format with \vspace{2.0em} ending
            const bodyPattern = /((?:To the\s+\\targetCompany\\\s*hiring team,|Dear\s+\\recipientName,)\s*(?:\\\\\s*)?\n)[\s\S]*?(\n\s*\\vspace\{2\.0em\})/i

            if (formattedLatex.match(bodyPattern)) {
                console.log('Found specific greeting pattern for replacement')
                // Insert with proper spacing - add a blank line after greeting and before closing
                finalLatex = formattedLatex.replace(bodyPattern, `$1\n${latexFormattedContent}\n$2`)
            } else {
                console.warn('Specific pattern not found, trying alternatives...')
                // Try more flexible patterns with proper spacing
                const alternativePatterns = [
                    /((?:To the|Dear)\s+[^,\n]*,\s*(?:\\\\\s*)?\n)[\s\S]*?(\n\s*\\vspace\{2\.0em\})/i,
                    /((?:To the|Dear)\s+[^,\n]*,\s*(?:\\\\\s*)?\n)[\s\S]*?(\n\s*(?:Sincerely|Cordialement))/i
                ]

                let replaced = false
                for (let i = 0; i < alternativePatterns.length; i++) {
                    const pattern = alternativePatterns[i]
                    if (formattedLatex.match(pattern)) {
                        console.log(`Using alternative pattern ${i + 1} for content replacement`)
                        // Insert with proper spacing for alternative patterns too
                        finalLatex = formattedLatex.replace(pattern, `$1\n${latexFormattedContent}\n$2`)
                    }
                }

                if (!replaced) {
                    console.error('No suitable pattern found for content replacement')
                    throw new Error('Unable to locate content area for replacement in LaTeX document')
                }
            }

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    latex: finalLatex
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate PDF')
            }

            const data = await response.json()

            if (data.success && data.pdfData) {
                const byteCharacters = atob(data.pdfData)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)

                setGeneratedLatex(finalLatex)
                setPdfUrl(url)
                setShowPdfPreview(true)
                setIsEditingLetter(false)

                console.log('✅ PDF regenerated successfully with edited content')
            } else {
                throw new Error(data.error || 'Failed to generate PDF')
            }
        } catch (error: any) {
            console.error('Error generating PDF from edited text:', error)
            setError(error.message || 'Failed to generate PDF with edited content. Please try again.')
            setTimeout(() => setError(''), 5000)
        } finally {
            setIsPdfGenerating(false)
        }
    }

    const generatePdfAndPreview = async (latexContent: string) => {
        setIsPdfGenerating(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No valid session found')
            }

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    latex: latexContent
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate PDF')
            }

            const data = await response.json()

            if (data.success && data.pdfData) {
                const byteCharacters = atob(data.pdfData)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)

                setPdfUrl(url)
                setShowPdfPreview(true)
            } else {
                throw new Error(data.error || 'Failed to generate PDF')
            }
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            setError(error.message || 'Failed to generate PDF.')
        } finally {
            setIsPdfGenerating(false)
        }
    }

    return (
        <>
            {/* Main Input Container - ChatGPT Style */}
            <div className="w-full max-w-3xl">
                <form onSubmit={handleGenerateCoverLetter}>
                    <div className="chat-input-container p-3 sm:p-4">
                        {/* Textarea */}
                        <Textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            className="w-full min-h-[120px] max-h-[300px] resize-none bg-transparent border-0 text-[#ececec] placeholder-[#666] focus:ring-0 focus:outline-none text-base"
                            rows={4}
                        />

                        {/* Bottom toolbar */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2e2e2e]">
                            <div className="flex items-center gap-2">
                                {/* Attach Resume Button */}
                                <label className="feature-pill cursor-pointer">
                                    <Paperclip className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        {isUploadingResume ? 'Processing...' : hasResumeAttached ? 'Resume ✓' : 'Attach Resume'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={handleResumeUpload}
                                        disabled={isUploadingResume}
                                    />
                                </label>

                                {/* Language Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowLanguageModal(true)}
                                    className="feature-pill"
                                >
                                    <Globe className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        {selectedLanguage === 'english' ? 'English' : 'Français'}
                                    </span>
                                </button>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={!jobDescription.trim() || isLoading || isPdfGenerating}
                                className="bg-[#ececec] hover:bg-white text-[#0d0d0d] rounded-full p-2.5 h-auto disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {isLoading || isPdfGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Status Messages */}
                {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-300 text-sm">
                        {success}
                    </div>
                )}

                {/* Helper text */}
                <p className="text-center text-[#666] text-xs mt-4">
                    Paste a job description and generate a personalized cover letter in seconds.
                </p>
            </div>

            {/* Language Selection Modal */}
            {showLanguageModal && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
                    onClick={() => setShowLanguageModal(false)}
                >
                    <div
                        className="bg-[#171717] rounded-xl max-w-md w-full p-6 border border-[#2e2e2e]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-[#ececec] mb-4">Select Language</h3>
                        <div className="space-y-3 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLanguage('english')
                                    setShowLanguageModal(false)
                                }}
                                className={`w-full p-3 text-left rounded-lg border transition-colors ${selectedLanguage === 'english'
                                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                                    : 'border-[#2e2e2e] hover:border-[#3a3a3a] text-[#a1a1a1]'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">🇺🇸</span>
                                    <div>
                                        <div className="font-medium text-[#ececec]">English</div>
                                        <div className="text-sm text-[#666]">Generate in English</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedLanguage('french')
                                    setShowLanguageModal(false)
                                }}
                                className={`w-full p-3 text-left rounded-lg border transition-colors ${selectedLanguage === 'french'
                                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                                    : 'border-[#2e2e2e] hover:border-[#3a3a3a] text-[#a1a1a1]'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">🇫🇷</span>
                                    <div>
                                        <div className="font-medium text-[#ececec]">Français</div>
                                        <div className="text-sm text-[#666]">Générer en français</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowLanguageModal(false)}
                            className="w-full border-[#2e2e2e] text-[#a1a1a1] hover:bg-[#212121]"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Cover Letter Modal */}
            {isEditingLetter && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[10000]">
                    <div className="bg-[#171717] rounded-xl w-full max-w-5xl max-h-[98vh] flex flex-col border border-[#2e2e2e]">
                        <div className="flex items-center justify-between p-4 border-b border-[#2e2e2e]">
                            <h3 className="text-lg font-semibold text-[#ececec]">Edit Cover Letter</h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => generatePdfFromText(editableLetter, editableRecipientName, editableCompany, editablePosition, editableSubject)}
                                    disabled={isPdfGenerating}
                                    className="bg-white hover:bg-gray-100 text-black border border-[#2e2e2e] text-sm"
                                >
                                    {isPdfGenerating ? 'Compiling...' : 'Recompile'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditingLetter(false)}
                                    className="text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#212121]"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-auto">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1a1] mb-1">Recipient</label>
                                        <Input
                                            placeholder="Hiring Manager"
                                            value={editableRecipientName}
                                            onChange={(e) => setEditableRecipientName(e.target.value)}
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1a1] mb-1">Company</label>
                                        <Input
                                            placeholder="Company Name"
                                            value={editableCompany}
                                            onChange={(e) => setEditableCompany(e.target.value)}
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1a1] mb-1">Position</label>
                                        <Input
                                            placeholder="Software Engineer"
                                            value={editablePosition}
                                            onChange={(e) => setEditablePosition(e.target.value)}
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1a1] mb-1">Subject</label>
                                        <Input
                                            placeholder="Application for..."
                                            value={editableSubject}
                                            onChange={(e) => setEditableSubject(e.target.value)}
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#a1a1a1] mb-1">Content</label>
                                    <Textarea
                                        value={editableLetter}
                                        onChange={(e) => setEditableLetter(e.target.value)}
                                        className="w-full min-h-[400px] resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] whitespace-pre-wrap"
                                        placeholder="Your cover letter content will appear here..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {showPdfPreview && pdfUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999]">
                    <div className="bg-[#171717] rounded-xl w-full max-w-6xl max-h-[98vh] flex flex-col border border-[#2e2e2e] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#2e2e2e]">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <Download className="h-5 w-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#ececec]">Your Cover Letter</h3>
                                    <p className="text-sm text-[#666]">Generated successfully</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setIsEditingLetter(true)}
                                    className="bg-[#212121] hover:bg-[#2e2e2e] text-[#ececec] border border-[#2e2e2e]"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => {
                                        const a = document.createElement('a')
                                        a.href = pdfUrl
                                        a.download = 'cover-letter.pdf'
                                        document.body.appendChild(a)
                                        a.click()
                                        document.body.removeChild(a)
                                    }}
                                    className="bg-white hover:bg-gray-100 text-black border border-[#2e2e2e]"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowPdfPreview(false)
                                        URL.revokeObjectURL(pdfUrl)
                                        setPdfUrl('')
                                    }}
                                    className="text-[#666] hover:text-[#ececec] hover:bg-[#212121]"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 bg-[#0d0d0d] p-4">
                            <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                    className="w-full h-full border-0"
                                    title="Cover Letter Preview"
                                    style={{ minHeight: '90vh', height: '90vh' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}