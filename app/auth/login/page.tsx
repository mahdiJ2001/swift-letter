'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)
    const [error, setError] = useState('')

    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || searchParams.get('redirect_to') || '/profile'
    const { signInWithGoogle } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.user) {
                router.refresh()
                router.push(redirectTo)
            }
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setIsOAuthLoading(true)
        setError('')

        try {
            await signInWithGoogle()
        } catch (error: any) {
            setError(error.message || 'Failed to sign in with Google')
        } finally {
            setIsOAuthLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d]">
            <Header />

            <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="w-full max-w-md">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-[#a1a1a1] hover:text-emerald-500 mb-6 sm:mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm sm:text-base">Back to home</span>
                    </Link>

                    {/* Form */}
                    <div className="bg-[#171717] rounded-xl border border-[#2e2e2e] p-6 sm:p-8">
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-xl sm:text-2xl font-bold text-[#ececec]">Welcome back</h1>
                            <p className="text-[#a1a1a1] mt-2 text-sm sm:text-base">Sign in to your account</p>
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isOAuthLoading || isLoading}
                            className="w-full flex items-center justify-center px-4 py-3.5 sm:py-3 border border-[#2e2e2e] rounded-lg bg-[#212121] text-[#ececec] hover:bg-[#2e2e2e] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#171717] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                        >
                            {isOAuthLoading ? (
                                <div className="w-5 h-5 border-2 border-[#2e2e2e] border-t-emerald-500 rounded-full animate-spin mr-3"></div>
                            ) : (
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#2e2e2e]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#171717] text-[#a1a1a1]">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                    Email address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-[#212121] border border-[#2e2e2e] rounded-lg text-[#ececec] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full px-4 py-3 bg-[#212121] border border-[#2e2e2e] rounded-lg text-[#ececec] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#a1a1a1] transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#2e2e2e]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-[#a1a1a1]">
                                Don't have an account?{' '}
                                <Link
                                    href="/auth/signup"
                                    className="font-medium text-white hover:text-gray-200"
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}