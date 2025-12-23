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
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
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
                        credits: data.credits || 0
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
        console.log('Profile updated:', updatedProfile)
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
                <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading profile...</p>
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
            <div className="min-h-screen premium-bg">
                {/* Background Elements */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="floating-orb floating-orb-1"></div>
                    <div className="floating-orb floating-orb-2"></div>
                    <div className="floating-orb floating-orb-3"></div>
                    <div className="grid-pattern"></div>
                </div>
                <Header />
                <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                    <div className="text-center">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchProfile}
                            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
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

            <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                <div className="mb-2 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
                    <p className="text-gray-600 mt-2">
                        Complete your profile to generate personalized cover letters
                    </p>
                </div>

                <ProfileForm
                    profile={profile}
                    onProfileUpdate={handleProfileUpdate}
                />

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

            </div>

            <Footer />
        </div>
    )
}
