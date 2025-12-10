'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Zap, Download, ArrowLeft } from 'lucide-react'

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

export default function GeneratorPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLetter, setGeneratedLetter] = useState('')
    const [generatedLatex, setGeneratedLatex] = useState('')
    const [hasJobDescription, setHasJobDescription] = useState(false)
    const [isPdfGenerating, setIsPdfGenerating] = useState(false)
    const { session, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth/login?redirectTo=/generator')
            return
        }

        if (session?.user?.id) {
            fetchProfile()
        }

        // Check if job description exists in sessionStorage (client-side only)
        if (typeof window !== 'undefined') {
            const jobDesc = sessionStorage.getItem('jobDescription')
            setHasJobDescription(!!jobDesc)

            if (!jobDesc) {
                // No job description, redirect to home
                router.push('/')
                return
            }
        }
    }, [session, loading, router])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/profile?userId=${session?.user?.id}`)

            if (response.ok) {
                const data = await response.json()
                if (data) {
                    // Convert null values to undefined for TypeScript compatibility
                    const convertedProfile: UserProfile = {
                        ...data,
                        links: data.links || undefined,
                        education: data.education || undefined,
                        certifications: data.certifications || undefined,
                        languages: data.languages || undefined,
                        location: data.location || undefined,
                        credits: data.credits || 0
                    }
                    setProfile(convertedProfile)
                }
            } else if (response.status === 404) {
                // Profile doesn't exist, redirect to profile page
                router.push('/profile')
                return
            } else {
                throw new Error('Failed to fetch profile')
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error)
            setError('Failed to load profile data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateCoverLetter = async () => {
        if (typeof window === 'undefined') return

        const jobDescription = sessionStorage.getItem('jobDescription')

        if (!jobDescription || !profile) {
            setError('Missing job description or profile data')
            return
        }

        // Check if profile is complete
        if (!profile.full_name || !profile.email || !profile.phone || !profile.experiences || !profile.skills) {
            setError('Please complete all required fields in your profile first (Name, Email, Phone, Experiences, Skills)')
            router.push('/profile')
            return
        }

        setIsGenerating(true)
        setError('')

        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No valid session found')
            }

            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    profile: {
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone,
                        location: profile.location,
                        linkedin: profile.linkedin,
                        github: profile.github,
                        portfolio: profile.portfolio,
                        experiences: profile.experiences,
                        projects: profile.projects,
                        skills: profile.skills,
                        education: profile.education,
                        certifications: profile.certifications,
                        languages: profile.languages
                    },
                    jobDescription,
                    language: 'english',
                    generationMode: 'polished'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate cover letter')
            }

            const data = await response.json()

            if (data.success) {
                setGeneratedLetter(data.content)
                setGeneratedLatex(data.latex)
                setSuccess(`Cover letter generated successfully! You have ${data.creditsRemaining} credits remaining.`)

                // Clear the stored job description since we've used it
                sessionStorage.removeItem('jobDescription')
                setHasJobDescription(false)

                // Refresh profile to update credits display
                fetchProfile()
            } else {
                throw new Error(data.error || 'Failed to generate cover letter')
            }

        } catch (error: any) {
            console.error('Error generating cover letter:', error)
            setError(error.message || 'Failed to generate cover letter. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownloadPdf = async () => {
        if (!generatedLatex) {
            setError('No LaTeX content available for PDF generation')
            return
        }

        setIsPdfGenerating(true)
        setError('')

        try {
            // Get the current session token
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
                    latex: generatedLatex
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate PDF')
            }

            // Download the PDF
            const pdfBlob = await response.blob()
            const url = window.URL.createObjectURL(pdfBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'cover-letter.pdf'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setSuccess('PDF downloaded successfully!')

        } catch (error: any) {
            console.error('Error generating PDF:', error)
            setError(error.message || 'Failed to generate PDF. Please try again.')
        } finally {
            setIsPdfGenerating(false)
        }
    }

    const handleNewGeneration = () => {
        setGeneratedLetter('')
        setGeneratedLatex('')
        setError('')
        setSuccess('')
        router.push('/')
    }

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading generator...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
            <Header />

            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
                    <p className="text-gray-600 mt-2">
                        Generate your personalized cover letter powered by AI
                    </p>
                </div>

                {/* Back button if no job description */}
                {!hasJobDescription && !generatedLetter && (
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Home</span>
                        </Button>
                    </div>
                )}

                {/* Success/Error Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-600 text-sm">{success}</p>
                    </div>
                )}

                {/* Generate Cover Letter Section */}
                {hasJobDescription && !generatedLetter && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 text-green-600" />
                                <span>Generate Cover Letter</span>
                            </CardTitle>
                            <CardDescription>
                                Your profile and job description are ready! Click the button below to generate your personalized cover letter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Button
                                    onClick={handleGenerateCoverLetter}
                                    disabled={isGenerating || !profile}
                                    size="lg"
                                    className="w-full"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating Cover Letter...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Generate Cover Letter
                                        </>
                                    )}
                                </Button>

                                <p className="text-sm text-gray-500 text-center">
                                    Credits remaining: {profile?.credits || 0}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Generated Cover Letter Display */}
                {generatedLetter && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <span>Your Generated Cover Letter</span>
                            </CardTitle>
                            <CardDescription>
                                Review and customize your generated cover letter below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                                    {generatedLetter}
                                </pre>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedLetter)}>
                                    Copy to Clipboard
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadPdf}
                                    disabled={isPdfGenerating || !generatedLatex}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    {isPdfGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                                <Button onClick={handleNewGeneration}>
                                    Generate Another
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>

            <Footer />
        </div>
    )
}