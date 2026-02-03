'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WaitlistPage() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            // For now, just simulate a submission
            // You can connect this to your backend/Supabase later
            await new Promise(resolve => setTimeout(resolve, 1000))
            setIsSubmitted(true)
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
            {/* Header */}
            <header className="border-b border-[#2e2e2e]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image
                                src="/logos/SL.png"
                                alt="Swift Letter"
                                width={48}
                                height={48}
                                className="rounded-lg"
                            />
                            <span className="text-lg font-semibold text-[#ececec]">Swift Letter</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md text-center">
                    {/* Back Link */}
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-[#a1a1a1] hover:text-emerald-500 mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to home</span>
                    </Link>

                    {!isSubmitted ? (
                        <>
                            {/* Logo */}
                            <div className="mb-8">
                                <Image
                                    src="/logos/SL.png"
                                    alt="Swift Letter"
                                    width={80}
                                    height={80}
                                    className="rounded-2xl mx-auto"
                                />
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl font-bold text-[#ececec] mb-4">
                                Join the Waitlist
                            </h1>
                            <p className="text-[#a1a1a1] mb-8">
                                Be the first to know when we launch new features. Get early access and exclusive updates.
                            </p>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-12 pr-4 py-4 bg-[#171717] border border-[#2e2e2e] rounded-xl text-[#ececec] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-colors disabled:opacity-50 border border-[#2e2e2e]"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Joining...</span>
                                        </div>
                                    ) : (
                                        'Join Waitlist'
                                    )}
                                </Button>
                            </form>

                            <p className="mt-6 text-sm text-[#666]">
                                We respect your privacy. No spam, ever.
                            </p>
                        </>
                    ) : (
                        /* Success State */
                        <div className="bg-[#171717] rounded-2xl border border-[#2e2e2e] p-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2e2e2e]">
                                <CheckCircle className="h-8 w-8 text-black" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#ececec] mb-3">
                                You're on the list!
                            </h2>
                            <p className="text-[#a1a1a1] mb-6">
                                Thanks for joining! We'll notify you at <span className="text-white">{email}</span> when we have updates.
                            </p>
                            <Link href="/">
                                <Button className="bg-[#212121] hover:bg-[#2e2e2e] text-[#ececec] border border-[#2e2e2e]">
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#2e2e2e] py-6">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-[#666] text-sm">
                        © 2024 Swift Letter. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
