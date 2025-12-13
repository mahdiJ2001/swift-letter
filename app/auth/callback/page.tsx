'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                // Get the session from the URL fragments
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Error handling OAuth callback:', error.message)
                    router.push('/auth/login?error=oauth_callback_failed')
                    return
                }

                if (data.session) {
                    // User successfully logged in, redirect to profile or home
                    router.push('/profile')
                } else {
                    // No session found, redirect to login
                    router.push('/auth/login')
                }
            } catch (error) {
                console.error('Unexpected error during OAuth callback:', error)
                router.push('/auth/login?error=oauth_callback_failed')
            }
        }

        handleOAuthCallback()
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Completing sign in...</p>
            </div>
        </div>
    )
}