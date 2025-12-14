'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clipboard, Zap, Download, PenTool, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
    const [showWritingStyle, setShowWritingStyle] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('english')
    const [showLanguageModal, setShowLanguageModal] = useState(false)
    const [isEditingLetter, setIsEditingLetter] = useState(false)
    const [editableLetter, setEditableLetter] = useState('')
    const [editableRecipientName, setEditableRecipientName] = useState('')
    const [editableCompany, setEditableCompany] = useState('')
    const [editablePosition, setEditablePosition] = useState('')
    const [editableSubject, setEditableSubject] = useState('')
    const [isUploadingResume, setIsUploadingResume] = useState(false)
    const [showErrorPopup, setShowErrorPopup] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)
    const [showFeedbackForm, setShowFeedbackForm] = useState(false)
    const [feedbackText, setFeedbackText] = useState('')
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText()
            setJobDescription(text)
        } catch (err) {
            console.error('Failed to read clipboard:', err)
        }
    }

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file.')
            return
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size must be less than 10MB.')
            return
        }

        setIsUploadingResume(true)
        setError('')
        setSuccess('Processing PDF, please wait...')

        try {
            console.log('Starting PDF processing...')

            // Create FormData to send the file to API
            const formData = new FormData()
            formData.append('file', file)

            setSuccess('Extracting text from PDF...')

            // Send to API endpoint for processing
            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                body: formData
            })

            setSuccess('Processing with AI...')

            if (!response.ok) {
                let errorMessage = 'Failed to process PDF'
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.error || errorMessage
                } catch {
                    // If we can't parse the error response, provide a helpful message
                    if (response.status === 500) {
                        errorMessage = 'Server error while processing PDF. This might be due to a large file or temporary server issue. Please try again with a smaller PDF or wait a moment and retry.'
                    }
                }
                throw new Error(errorMessage)
            }

            const responseData = await response.json()
            console.log('API Response:', responseData)

            const extractedData = responseData.data
            console.log('Extracted data:', extractedData)

            // Format arrays for display
            const { formatSkillsArray, formatLanguagesArray } = await import('@/lib/resume-parser')

            // Prepare profile data for automatic save
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

            // Automatically save to profile
            if (user) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    // First check if profile exists in database
                    const checkResponse = await fetch(`/api/profile?userId=${user.id}`)
                    let existingProfile = null
                    if (checkResponse.ok) {
                        existingProfile = await checkResponse.json()
                    }

                    const updateResponse = await fetch('/api/profile', {
                        method: existingProfile ? 'PUT' : 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            ...updatedProfile,
                            ...(existingProfile ? { id: existingProfile.id } : {})
                        })
                    })

                    if (updateResponse.ok) {
                        const savedProfile = await updateResponse.json()
                        setProfile(savedProfile)
                        setSuccess('Resume processed and profile automatically saved!')
                        setShowSuccessPopup(true)
                    } else {
                        const errorData = await updateResponse.json()
                        throw new Error(`Failed to save profile: ${errorData.error || 'Unknown error'}`)
                    }
                } else {
                    throw new Error('No active session found')
                }
            } else {
                throw new Error('User not authenticated')
            }

            // Clear the file input
            event.target.value = ''
        } catch (error: any) {
            console.error('Resume processing error:', error)
            setErrorMessage(error.message || 'Failed to process resume. Please try again.')
            setShowErrorPopup(true)
            setError('')
            setSuccess('')
        } finally {
            setIsUploadingResume(false)
        }
    }

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feedbackText.trim()) return

        setIsSubmittingFeedback(true)
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedback: feedbackText.trim(),
                    page: 'generator',
                    user_id: user?.id || null
                })
            })

            if (response.ok) {
                setFeedbackText('')
                setShowFeedbackForm(false)
                setSuccess('Thank you for your feedback!')
            } else {
                setError('Failed to submit feedback. Please try again.')
            }
        } catch (error) {
            setError('Failed to submit feedback. Please try again.')
        } finally {
            setIsSubmittingFeedback(false)
        }
    }

    const handleGenerateCoverLetter = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!jobDescription.trim()) return

        setIsLoading(true)
        setError('')
        setSuccess('')

        if (!user) {
            // Redirect to login if not authenticated
            router.push('/auth/login?redirectTo=/')
            return
        }

        try {
            // Check if user has a complete profile
            const response = await fetch(`/api/profile?userId=${user.id}`)
            if (!response.ok) {
                // No profile exists, redirect to create one
                sessionStorage.setItem('jobDescription', jobDescription)
                router.push('/profile')
                return
            }

            const profileData = await response.json()

            // Check if profile has required fields
            if (!profileData || !profileData.full_name || !profileData.email || !profileData.phone || !profileData.experiences || !profileData.skills) {
                // Profile incomplete, redirect to fill it
                sessionStorage.setItem('jobDescription', jobDescription)
                router.push('/profile')
                return
            }

            // Profile is complete, generate cover letter
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
            // Get the current session token
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
                const errorText = await generateResponse.text()
                console.error('API Error Response:', errorText)
                try {
                    const errorData = JSON.parse(errorText)
                    throw new Error(errorData.error || `API Error: ${generateResponse.status} ${generateResponse.statusText}`)
                } catch (parseError) {
                    throw new Error(`API Error: ${generateResponse.status} ${generateResponse.statusText} - ${errorText}`)
                }
            }

            const data = await generateResponse.json()

            if (data.success) {
                setGeneratedLetter(data.content)
                setGeneratedLatex(data.latex)
                // Extract text content from LaTeX for editing
                const textMatch = data.content.match(/% Letter Body[\s\S]*?% =========================\s*([\s\S]*?)\s*\\vspace{2\.0em}/)
                if (textMatch) {
                    const textContent = textMatch[1]
                        .replace(/\\noindent\s*/g, '')
                        .replace(/\\vspace{[^}]*}/g, '\n')
                        .replace(/\\\\\s*/g, '\n')
                        .replace(/\\textbf\{([^}]*)\}/g, '$1')
                        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
                        .replace(/\\targetCompany\s*\\\s*/g, '')
                        .replace(/\\targetPosition\s*\\\s*/g, '')
                        .replace(/\\myname/g, profile?.full_name || '')
                        .replace(/\\mylocation/g, profile?.location || '')
                        .replace(/\\myemail/g, profile?.email || '')
                        .replace(/\\myphone/g, profile?.phone || '')
                        .replace(/\\%/g, '%')
                        .replace(/\\_/g, '_')
                        .replace(/\\&/g, '&')
                        .replace(/\\#/g, '#')
                        .replace(/\\\$/g, '$')
                        .trim()
                    setEditableLetter(textContent)
                }

                // Extract individual fields from LaTeX
                const companyMatch = data.content.match(/\\newcommand\{\\targetCompany\}\{([^}]*)\}/)
                const positionMatch = data.content.match(/\\newcommand\{\\targetPosition\}\{([^}]*)\}/)
                const subjectMatch = data.content.match(/\\newcommand\{\\targetSubject\}\{([^}]*)\}/)
                const recipientMatch = data.content.match(/\\newcommand\{\\recipientName\}\{([^}]*)\}/)

                setEditableCompany(companyMatch?.[1] || '')
                setEditablePosition(positionMatch?.[1] || '')
                setEditableSubject(subjectMatch?.[1] || '')
                setEditableRecipientName(recipientMatch?.[1] || '')
                // Generate PDF directly
                await generatePdfAndPreview(data.latex)
            } else {
                throw new Error(data.error || 'Failed to generate cover letter')
            }

        } catch (error: any) {
            console.error('Error generating cover letter:', error)
            let errorMessage = error.message || 'Failed to generate cover letter. Please try again.'

            // Provide more helpful error messages for common issues
            if (errorMessage.includes('Edge Function returned a non-2xx status code') ||
                errorMessage.includes('AWS credentials are not configured') ||
                errorMessage.includes('Internal Server Error')) {
                errorMessage = 'Cover letter generation is currently unavailable. The AI service may be temporarily down or not properly configured. Please try again later.'
            }

            setError(errorMessage)
        }
    }



    const generatePdfFromText = async (textContent: string, recipientName: string = '', companyName: string = '', positionName: string = '', subjectText: string = '') => {
        setIsPdfGenerating(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No valid session found')
            }

            // Use provided values or extract from text content as fallback
            const targetCompany = companyName || textContent.match(/To the Hiring Team at ([^,\n]+)/)?.[1]?.trim() || 'Company'
            const targetPosition = positionName || textContent.match(/saw the ([^,\n]+) opening/)?.[1]?.trim() || 'Position'
            const targetRecipient = recipientName || 'Hiring Manager'
            const targetSubject = subjectText || `Application for ${targetPosition} at ${targetCompany}`

            // Use the original LaTeX template with updated content
            const formattedLatex = generatedLatex
                .replace(/\\newcommand\{\\recipientName\}\{[^}]*\}/g, `\\newcommand{\\recipientName}{${targetRecipient}}`)
                .replace(/\\newcommand\{\\targetCompany\}\{[^}]*\}/g, `\\newcommand{\\targetCompany}{${targetCompany}}`)
                .replace(/\\newcommand\{\\targetPosition\}\{[^}]*\}/g, `\\newcommand{\\targetPosition}{${targetPosition}}`)
                .replace(/\\newcommand\{\\targetSubject\}\{[^}]*\}/g, `\\newcommand{\\targetSubject}{${targetSubject}}`)
                .replace(
                    /% =========================\s*% Letter Body\s*% =========================[\s\S]*?\\vspace\{2\.0em\}/,
                    `% =========================
% Letter Body
% =========================
${textContent.replace(/%/g, '\\%').replace(/&/g, '\\&').replace(/#/g, '\\#').replace(/\$/g, '\\$').replace(/_/g, '\\_')}

\\vspace{2.0em}`
                )

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    latex: formattedLatex
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('PDF API Error Response:', errorText)
                throw new Error(`PDF API Error: ${response.status} - ${errorText}`)
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

                // Update the generatedLatex with the new formatted version
                setGeneratedLatex(formattedLatex)

                setPdfUrl(url)
                setShowPdfPreview(true)
                setIsEditingLetter(false)
                setSuccess('Cover letter updated successfully!')
            } else {
                throw new Error(data.error || 'Failed to generate PDF')
            }
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            setError(error.message || 'Failed to generate PDF. Please try again.')
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
                const errorText = await response.text()
                console.error('PDF API Error Response:', errorText)
                try {
                    const errorData = JSON.parse(errorText)
                    throw new Error(errorData.error || `PDF API Error: ${response.status}`)
                } catch {
                    throw new Error(`PDF API Error: ${response.status} - ${errorText}`)
                }
            }

            const data = await response.json()

            if (data.success && data.pdfData) {
                // Convert base64 to blob URL for preview
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
                setSuccess('Cover letter generated successfully!')
            } else {
                throw new Error(data.error || 'Failed to generate PDF')
            }
        } catch (error: any) {
            console.error('Error generating PDF:', error)
            setError(error.message || 'Failed to generate PDF. Please try again.')
        } finally {
            setIsPdfGenerating(false)
        }
    }



    return (
        <Card className="w-full max-w-none mx-auto shadow-lg border-0 bg-white">
            <CardHeader className="text-left pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Generate Cover Letter
                    </CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('resume-upload')?.click()}
                        disabled={isUploadingResume}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
                    >
                        {isUploadingResume ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        <span>{isUploadingResume ? 'Processing Resume...' : 'Attach Resume'}</span>
                    </Button>
                    <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleResumeUpload}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleGenerateCoverLetter} className="space-y-6">

                    <div className="relative">
                        <Textarea
                            id="jobDescription"
                            rows={20}
                            className="resize-none text-base min-h-[500px] w-full"
                            placeholder={
                                "Paste the complete job description here...\n\n" +
                                "Example:\n" +
                                "Software Engineer - Frontend Development\n" +
                                "ABC Tech Company\n\n" +
                                "We are looking for a skilled Frontend Developer to join our team...\n" +
                                "[rest of job description]"
                            }
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            required
                        />

                        {/* Language Button - Top Right */}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowLanguageModal(true)}
                            className="absolute top-4 right-4"
                        >
                            <span className="text-sm mr-1">🌐</span>
                            <span>{selectedLanguage === 'english' ? 'EN' : 'FR'}</span>
                        </Button>

                        {/* Paste Button - Center */}
                        {!jobDescription && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handlePasteFromClipboard}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            >
                                <Clipboard className="h-4 w-4 mr-2" />
                                <span>Paste</span>
                            </Button>
                        )}

                        {/* Character Count */}
                        <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                            {jobDescription.length} characters
                        </div>
                    </div>



                    {/* Submit Button */}
                    <div className="text-center">
                        <Button
                            type="submit"
                            disabled={!jobDescription.trim() || isLoading || isPdfGenerating}
                            size="lg"
                            className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading || isPdfGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {isPdfGenerating ? 'Generating PDF...' : 'Generating Cover Letter...'}
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Generate Cover Letter
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Error and Success Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-600 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Word Count & Validation */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            {jobDescription.trim() ? (
                                <span className="text-green-600">✓ Ready to generate your cover letter!</span>
                            ) : (
                                <span>Please paste the job description to continue</span>
                            )}
                        </p>
                    </div>
                </form>

                {/* Language Selection Modal */}
                {showLanguageModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold mb-4">Select Language</h3>
                            <div className="space-y-3 mb-6">
                                <button
                                    onClick={() => setSelectedLanguage('english')}
                                    className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${selectedLanguage === 'english'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <span className="text-xl mr-3">🇺🇸</span>
                                        <div>
                                            <div className="font-medium">English</div>
                                            <div className="text-sm text-gray-500">Generate cover letter in English</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedLanguage('french')}
                                    className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${selectedLanguage === 'french'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <span className="text-xl mr-3">🇫🇷</span>
                                        <div>
                                            <div className="font-medium">Français</div>
                                            <div className="text-sm text-gray-500">Générer la lettre de motivation en français</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLanguageModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setShowLanguageModal(false)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Select
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Cover Letter Modal */}
                {isEditingLetter && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-xl font-semibold text-gray-900">Edit Cover Letter</h3>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        onClick={() => generatePdfFromText(editableLetter, editableRecipientName, editableCompany, editablePosition, editableSubject)}
                                        disabled={isPdfGenerating}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                    >
                                        {isPdfGenerating ? 'Recompiling...' : 'Recompile & Preview'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditingLetter(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 p-6 overflow-auto">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Recipient Information
                                        </label>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">To (Recipient)</label>
                                                <Input
                                                    placeholder="Hiring Manager"
                                                    value={editableRecipientName}
                                                    onChange={(e) => setEditableRecipientName(e.target.value)}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                                                <Input
                                                    placeholder="Company Name"
                                                    value={editableCompany}
                                                    onChange={(e) => {
                                                        setEditableCompany(e.target.value)
                                                        // Also update in letter content
                                                        const updated = editableLetter.replace(
                                                            /To the Hiring Team at [^,\n]+/,
                                                            `To the Hiring Team at ${e.target.value}`
                                                        )
                                                        setEditableLetter(updated)
                                                    }}
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                                                <Input
                                                    placeholder="Software Engineer"
                                                    value={editablePosition}
                                                    onChange={(e) => {
                                                        setEditablePosition(e.target.value)
                                                        // Also update in letter content
                                                        const updated = editableLetter.replace(
                                                            /saw the ([^,\n]+) opening/,
                                                            `saw the ${e.target.value} opening`
                                                        )
                                                        setEditableLetter(updated)
                                                    }}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                                <Input
                                                    placeholder="Application for Position at Company"
                                                    value={editableSubject}
                                                    onChange={(e) => setEditableSubject(e.target.value)}
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cover Letter Content
                                        </label>
                                        <Textarea
                                            value={editableLetter}
                                            onChange={(e) => setEditableLetter(e.target.value)}
                                            className="w-full min-h-[500px] resize-none text-sm leading-relaxed"
                                            placeholder="Edit your cover letter content here..."
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Edit the text naturally - formatting will be handled automatically when you recompile.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF Preview Modal */}
                {showPdfPreview && pdfUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9000 }}>
                        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center space-x-2">
                                    <Zap className="h-5 w-5 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Your Cover Letter</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={() => setIsEditingLetter(true)}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        <PenTool className="h-4 w-4 mr-2" />
                                        Edit Cover
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
                                        className="bg-red-600 text-white hover:bg-red-700"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowPdfPreview(false)
                                            URL.revokeObjectURL(pdfUrl)
                                            setPdfUrl('')
                                            setGeneratedLetter('')
                                            setGeneratedLatex('')
                                            setJobDescription('')
                                        }}
                                    >
                                        Generate Another
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowPdfPreview(false)
                                            URL.revokeObjectURL(pdfUrl)
                                            setPdfUrl('')
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 p-2 relative overflow-hidden">
                                <div className="relative w-full h-full">
                                    <iframe
                                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full border-0 rounded"
                                        title="Cover Letter Preview"
                                        style={{
                                            height: 'calc(95vh - 60px)',
                                            marginTop: '-40px',
                                            paddingTop: '40px',
                                            border: 'none'
                                        }}
                                    />
                                    {/* Overlay to hide any remaining toolbar */}
                                    <div
                                        className="absolute top-0 left-0 w-full bg-white z-10"
                                        style={{ height: '40px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Error Popup Modal */}
            {showErrorPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Saving Profile</h3>
                            <p className="text-gray-600 mb-6">{errorMessage}</p>
                            <Button
                                onClick={() => {
                                    setShowErrorPopup(false)
                                    setErrorMessage('')
                                }}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup Modal */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Updated Successfully!</h3>
                            <p className="text-gray-600 mb-6">
                                Your resume has been processed and your profile has been automatically updated.
                                You can check the extracted information or edit it from the profile interface.
                            </p>
                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSuccessPopup(false)}
                                    className="flex-1"
                                >
                                    Continue
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSuccessPopup(false)
                                        router.push('/profile')
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    View Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Form Modal */}
            {showFeedbackForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <form onSubmit={handleFeedbackSubmit}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Feedback</h3>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Tell us about your experience, report bugs, or suggest improvements..."
                                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                            <div className="flex space-x-3 mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowFeedbackForm(false)
                                        setFeedbackText('')
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmittingFeedback || !feedbackText.trim()}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feedback Bubble */}
            <button
                onClick={() => setShowFeedbackForm(true)}
                className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40 group"
                title="Send Feedback"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Send Feedback
                </span>
            </button>
        </Card>
    )
}