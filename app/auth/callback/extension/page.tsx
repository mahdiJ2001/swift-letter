'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Suspense } from 'react'

function ExtensionAuthCallbackContent() {
    const { session, user, loading } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (loading) return

        const isExtension = searchParams.get('extension') === 'true'

        if (!isExtension) {
            // Regular callback, redirect to dashboard
            router.push('/dashboard')
            return
        }

        if (session && user) {
            // Create a simple auth token object
            const authData = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            }

            // Encode the auth data for URL safety
            const encodedAuth = btoa(JSON.stringify(authData))

            // Store in localStorage with a special key the extension can read
            localStorage.setItem('swift_letter_extension_auth', encodedAuth)

            setStatus('success')
        } else {
            // No session, redirect to login
            router.push('/auth/login?extension=true')
        }
    }, [session, user, loading, searchParams, router])

    const handleCopyToken = async () => {
        if (session && user) {
            const authData = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            }
            const encodedAuth = btoa(JSON.stringify(authData))
            
            try {
                await navigator.clipboard.writeText(encodedAuth)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch {
                // Fallback
                const textarea = document.createElement('textarea')
                textarea.value = encodedAuth
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        }
    }

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
                    <p className="text-gray-600">Please wait while we authenticate you.</p>
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        You are now signed in. Copy the token below and paste it into the browser extension.
                    </p>
                    
                    <button
                        onClick={handleCopyToken}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Auth Token
                            </>
                        )}
                    </button>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                        <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
                        <ol className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                                <span>Click the &quot;Copy Auth Token&quot; button above</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                                <span>Open the Swift Letter browser extension</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                                <span>Click &quot;Paste Auth Token&quot; in the extension</span>
                            </li>
                        </ol>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4">
                        You can close this tab after copying the token.
                    </p>
                </div>
            </div>
        )
    }

    return null
}

export default function ExtensionAuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        }>
            <ExtensionAuthCallbackContent />
        </Suspense>
    )
}