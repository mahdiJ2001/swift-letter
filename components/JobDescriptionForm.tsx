'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clipboard, Zap, Download } from 'lucide-react'
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

            // Profile is complete, generate cover letter directly
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
                    language: 'english',
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
                <CardTitle className="text-lg font-semibold text-gray-900">
                    Generate Cover Letter
                </CardTitle>
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
                        {/* Paste Button */}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handlePasteFromClipboard}
                            className="absolute top-4 right-4"
                        >
                            <Clipboard className="h-4 w-4 mr-2" />
                            <span>Paste</span>
                        </Button>

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

                {/* PDF Preview Modal */}
                {showPdfPreview && pdfUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center space-x-2">
                                    <Zap className="h-5 w-5 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Your Cover Letter</h3>
                                </div>
                                <div className="flex items-center space-x-2">
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
        </Card>
    )
}