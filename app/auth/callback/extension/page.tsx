'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Suspense } from 'react'

function ExtensionAuthCallbackContent() {
    const { session, user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        if (session && user) {
            // Redirect to dashboard
            router.push('/dashboard')
        } else {
            // No session, redirect to login
            router.push('/auth/login')
        }
    }, [session, user, loading, router])

    // Loading state
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
            <div className="max-w-md w-full bg-[#171717] rounded-xl border border-[#2e2e2e] p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
                <h2 className="text-xl font-bold text-[#ececec] mb-2">Completing Sign In...</h2>
                <p className="text-[#a1a1a1]">Please wait while we authenticate you.</p>
            </div>
        </div>
    )
}

export default function ExtensionAuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        }>
            <ExtensionAuthCallbackContent />
        </Suspense>
    )
}