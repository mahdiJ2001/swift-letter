'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
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

    // Function to convert LaTeX to readable text
    const parseLatexToReadable = (latex: string): string => {
        if (!latex) return ''

        try {
            // First, extract all newcommand definitions
            const commands: { [key: string]: string } = {}
            const commandMatches = latex.matchAll(/\\newcommand\{\\([^}]*)\}\{([^}]*)\}/g)
            for (const match of commandMatches) {
                commands[match[1]] = match[2]
            }

            // Also handle commands that reference other commands (like targetSubject)
            // Resolve nested command references
            const resolveCommand = (value: string): string => {
                let resolved = value
                for (const [cmd, val] of Object.entries(commands)) {
                    resolved = resolved.replace(new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g'), val)
                }
                // Handle \\ at for "at" text
                resolved = resolved.replace(/\\ at /g, ' at ')
                resolved = resolved.replace(/\\ /g, ' ')
                return resolved
            }

            // Resolve all commands
            for (const [cmd, value] of Object.entries(commands)) {
                commands[cmd] = resolveCommand(value)
            }

            // Extract content between \begin{document} and \end{document}
            const documentMatch = latex.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/)
            let content = documentMatch ? documentMatch[1] : latex

            // Replace command usages with their values
            for (const [cmd, value] of Object.entries(commands)) {
                const regex = new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g')
                content = content.replace(regex, value)
            }

            // Remove comments
            content = content.replace(/%[^\n]*\n/g, '\n')

            // Remove LaTeX environment commands
            content = content.replace(/\\begin\{center\}|\\end\{center\}/g, '')
            content = content.replace(/\\begin\{flushleft\}|\\end\{flushleft\}/g, '')

            // Handle vspace commands
            content = content.replace(/\\vspace\{[^}]*\}/g, '\n')

            // Handle custom commands
            content = content.replace(/\\headername\{([^}]*)\}/g, '$1')
            content = content.replace(/\\contactline\{([^}]*)\}/g, '$1')

            // Handle href commands
            content = content.replace(/\\href\{mailto:([^}]*)\}\{([^}]*)\}/g, '$2')
            content = content.replace(/\\href\{https?:\/\/[^}]*\}\{([^}]*)\}/g, '$1')

            // Handle text formatting
            content = content.replace(/\\textbf\{([^}]*)\}/g, '$1')
            content = content.replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/g, '$1')
            content = content.replace(/\{\\small\\textcolor\{[^}]*\}\{([^}]*)\}\}/g, '$1')
            content = content.replace(/\{\\small([^}]*)\}/g, '$1')
            content = content.replace(/\\small/g, '')
            content = content.replace(/\{\\fontsize\{[^}]*\}\{[^}]*\}\\selectfont\\textbf\{\\textcolor\{[^}]*\}\{([^}]*)\}\}\}/g, '$1')

            // Handle today command
            content = content.replace(/\\today/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))

            // Clean up remaining LaTeX
            content = content.replace(/\\\\/g, '\n')
            content = content.replace(/\\%/g, '%')
            content = content.replace(/\\_/g, '_')
            content = content.replace(/\\&/g, '&')
            content = content.replace(/\\#/g, '#')
            content = content.replace(/\\\$/g, '$')
            content = content.replace(/\\ /g, ' ')
            content = content.replace(/\\•/g, '•')
            content = content.replace(/ • /g, ' | ')

            // Remove any remaining backslash commands
            content = content.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
            content = content.replace(/\\[a-zA-Z]+/g, '')

            // Clean up braces
            content = content.replace(/\{|\}/g, '')

            // Clean up excessive whitespace
            content = content.replace(/[ \t]+/g, ' ')
            content = content.replace(/\n\s*\n\s*\n/g, '\n\n')
            content = content.trim()

            return content
        } catch (error) {
            console.error('Error parsing LaTeX:', error)
            return 'Error displaying cover letter. Please download the PDF to view it.'
        }
    }

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

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' })

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
            <div className="min-h-screen premium-bg">
                {/* Background Elements */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="floating-orb floating-orb-1"></div>
                    <div className="floating-orb floating-orb-2"></div>
                    <div className="floating-orb floating-orb-3"></div>
                    <div className="grid-pattern"></div>
                </div>
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
        <div className="min-h-screen premium-bg">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="floating-orb floating-orb-1"></div>
                <div className="floating-orb floating-orb-2"></div>
                <div className="floating-orb floating-orb-3"></div>
                <div className="grid-pattern"></div>
            </div>
            <Header />

            <div className="max-w-4xl mx-auto py-1 px-4 sm:px-6 relative z-10">
                <div className="mb-2 text-center">
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

                {/* Generated Cover Letter Modal */}
                {generatedLetter && (
                    <>
                        {/* Modal Backdrop with fade-in animation */}
                        <div
                            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-md z-[9998] animate-in fade-in duration-300"
                            onClick={handleNewGeneration}
                        />

                        {/* Modal Content with slide-up animation */}
                        <div
                            className="fixed inset-0 flex items-center justify-center z-[9999] p-4 sm:p-6 pointer-events-none animate-in zoom-in-95 fade-in duration-300"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden">

                                {/* Modern Header with gradient accent */}
                                <div className="relative px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="p-2 bg-green-50 rounded-lg">
                                                    <FileText className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Cover Letter Preview</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">Generated with AI • Ready to download</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleNewGeneration}
                                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                            aria-label="Close modal"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Letter Content - Styled like actual letter paper */}
                                <div className="flex-1 overflow-y-auto bg-gray-50 px-8 py-6">
                                    <div className="max-w-4xl mx-auto">
                                        {/* Letter Paper Effect */}
                                        <div className="bg-white shadow-lg rounded-lg p-12 border border-gray-200" style={{
                                            background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 100%)',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <div className="prose prose-gray max-w-none">
                                                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 font-serif tracking-wide" style={{ lineHeight: '1.8' }}>
                                                    {parseLatexToReadable(generatedLetter)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modern Footer with action buttons */}
                                <div className="px-8 py-5 border-t border-gray-100 bg-white">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <p className="text-sm text-gray-500">
                                            💡 <span className="font-medium">Tip:</span> Review carefully before downloading
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(parseLatexToReadable(generatedLetter))
                                                    setSuccess('✓ Copied to clipboard!')
                                                }}
                                                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                                Copy Text
                                            </Button>
                                            <Button
                                                onClick={handleDownloadPdf}
                                                disabled={isPdfGenerating || !generatedLatex}
                                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPdfGenerating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download PDF
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={handleNewGeneration}
                                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                                            >
                                                <Zap className="h-4 w-4 mr-2" />
                                                New Letter
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </>
                )}

            </div>

            <Footer />
        </div>
    )
}