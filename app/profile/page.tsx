'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProfileForm from '@/components/ProfileForm'

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
    resume_url?: string // Add resume URL field
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [resumeUrl, setResumeUrl] = useState<string>('')
    const { session, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth/login?redirectTo=/profile')
            return
        }

        if (session?.user?.id) {
            fetchProfile()
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
                        credits: data.credits || 0,
                        resume_url: data.resume_url || undefined // Ensure resume_url is included
                    }
                    setProfile(convertedProfile)
                }
            } else if (response.status === 404) {
                // Profile doesn't exist yet, that's okay
                setProfile(null)
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

    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile)
    }



    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0d0d0d]">
                <Header />
                <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-[#a1a1a1]">Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect in useEffect
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0d0d0d]">
                <Header />
                <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                    <div className="text-center">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={fetchProfile}
                            className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d]">
            <Header />

            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-[#ececec]">Your Profile</h1>
                    <p className="text-[#a1a1a1] mt-2">
                        Complete your profile to generate personalized cover letters for software engineering roles
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Side - Profile Form */}
                    <div className="lg:pr-4">
                        <ProfileForm
                            profile={profile}
                            onProfileUpdate={handleProfileUpdate}
                        />

                        {/* Success/Error Messages */}
                        {error && (
                            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mt-6">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-6">
                                <p className="text-white text-sm">{success}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Resume Preview */}
                    <div className="lg:pl-4">
                        <div className="sticky top-6">
                            <div className="bg-[#171717] border-[#2e2e2e] border rounded-lg h-[90vh] overflow-hidden">
                                <div className="bg-[#2e2e2e] px-6 py-4 border-b border-[#3e3e3e]">
                                    <h2 className="text-lg font-semibold text-[#ececec] flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        Resume Preview
                                    </h2>
                                </div>
                                <div className="p-6 h-full">
                                    {profile?.resume_url ? (
                                        <div className="w-full h-full overflow-hidden" style={{ marginBottom: '-40px', paddingBottom: '0' }}>
                                            <iframe
                                                src={`${profile.resume_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                className="w-full rounded-lg border border-[#2e2e2e]"
                                                title="Resume Preview"
                                                style={{ border: 'none', height: 'calc(100% + 40px)' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-[#a1a1a1]">
                                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6m-6 4h6m-6 4h4" />
                                            </svg>
                                            <h3 className="text-xl font-medium mb-2">No Resume Uploaded</h3>
                                            <p className="text-sm max-w-sm">
                                                Upload your resume PDF using the Quick Setup section on the left to see a preview here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
