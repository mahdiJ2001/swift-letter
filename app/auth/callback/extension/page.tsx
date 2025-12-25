'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

import { Suspense } from 'react'

function ExtensionAuthCallbackComponent() {
    const { session, user } = useAuth()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Handle extension auth callback
        const isExtension = searchParams.get('extension') === 'true'

        if (isExtension && session && user) {
            // Send session data to extension
            try {
                // Try to communicate with the extension
                if (window.chrome?.runtime) {
                    window.chrome.runtime.sendMessage({
                        type: 'AUTH_SUCCESS',
                        session: session,
                        user: user
                    })
                }

                // Also post message to parent window in case extension is listening
                window.postMessage({
                    type: 'SWIFT_LETTER_AUTH_SUCCESS',
                    session: session,
                    user: user
                }, '*')

                // Show success message and close tab
                setTimeout(() => {
                    window.close()
                }, 2000)

            } catch (error) {
                console.error('Failed to communicate with extension:', error)
            }
        }
    }, [session, user, searchParams])

    const isExtension = searchParams.get('extension') === 'true'

    if (!isExtension) {
        // Regular auth callback, redirect to dashboard
        if (session) {
            window.location.href = '/dashboard'
        }
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {session && user ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h2>
                        <p className="text-gray-600 mb-4">
                            You have successfully signed in to Swift Letter. You can now use the browser extension.
                        </p>
                        <p className="text-sm text-gray-500">
                            This tab will close automatically in a moment...
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
                        <p className="text-gray-600 mb-4">
                            Please wait while we complete your authentication.
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </>
                )}
            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
          // Additional message posting for extension
          window.addEventListener('message', function(event) {
            if (event.data.type === 'EXTENSION_AUTH_REQUEST') {
              // Extension is requesting auth data
              const authData = localStorage.getItem('sb-auth-token') || 
                              localStorage.getItem('supabase.auth.token');
              if (authData) {
                try {
                  const parsed = JSON.parse(authData);
                  window.postMessage({
                    type: 'SWIFT_LETTER_AUTH_SUCCESS',
                    session: parsed,
                    user: parsed.user
                  }, '*');
                } catch (e) {
                  console.error('Failed to parse auth data:', e);
                }
              }
            }
          });
        `
            }} />
        </div>
    )
}

export default function ExtensionAuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExtensionAuthCallbackComponent />
        </Suspense>
    )
}