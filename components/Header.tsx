'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, Coins, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import FeedbackForm from '@/components/FeedbackForm'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showCreditsModal, setShowCreditsModal] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [credits, setCredits] = useState<number | null>(null)
    const { user, signOut } = useAuth()

    // Fetch user credits when user is available
    useEffect(() => {
        const fetchCredits = async () => {
            if (!user) {
                setCredits(null)
                return
            }

            try {
                const response = await fetch(`/api/profile?userId=${user.id}`)
                if (response.ok) {
                    const profile = await response.json()
                    setCredits(profile?.credits || 0)
                }
            } catch (error) {
                console.error('Failed to fetch credits:', error)
            }
        }

        fetchCredits()
    }, [user])

    return (
        <header className="bg-[#0d0d0d] border-b border-[#2e2e2e] sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
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

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/"
                                className="text-[#a1a1a1] hover:text-[#ececec] text-sm font-medium transition-colors"
                            >
                                Generator
                            </Link>
                            <Link
                                href="/waitlist"
                                className="text-[#a1a1a1] hover:text-[#ececec] text-sm font-medium transition-colors"
                            >
                                Waitlist
                            </Link>
                            <Link
                                href="/profile"
                                className="text-[#a1a1a1] hover:text-[#ececec] text-sm font-medium transition-colors"
                            >
                                Profile
                            </Link>
                        </nav>
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-3">
                        {/* Feedback Button - Always visible */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFeedbackModal(true)}
                            className="text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717]"
                        >
                            <MessageCircle className="h-4 w-4 mr-1.5" />
                            <span>Feedback</span>
                        </Button>

                        {user ? (
                            <>
                                {credits !== null && (
                                    <button
                                        onClick={() => setShowCreditsModal(true)}
                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#212121] rounded-lg border border-[#2e2e2e] text-[#a1a1a1] hover:text-[#ececec] transition-colors"
                                    >
                                        <Coins className="h-4 w-4 text-white" />
                                        <span className="text-sm font-medium">{credits}</span>
                                    </button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717]"
                                >
                                    <Link href="/profile" className="flex items-center space-x-2">
                                        <User className="h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={signOut}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                >
                                    <LogOut className="h-4 w-4 mr-1.5" />
                                    <span>Sign Out</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717]"
                                >
                                    <Link href="/auth/login">
                                        Sign In
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className="bg-white hover:bg-gray-100 text-black border border-[#2e2e2e]"
                                >
                                    <Link href="/auth/signup">
                                        Get Started
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-[#2e2e2e] py-4 space-y-1 animate-in slide-in-from-top">
                        <Link
                            href="/"
                            className="block text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717] font-medium px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Generator
                        </Link>
                        <Link
                            href="/waitlist"
                            className="block text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717] font-medium px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Waitlist
                        </Link>
                        <Link
                            href="/profile"
                            className="block text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717] font-medium px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Profile
                        </Link>
                        <button
                            onClick={() => {
                                setShowFeedbackModal(true)
                                setIsMenuOpen(false)
                            }}
                            className="w-full text-left text-[#a1a1a1] hover:text-[#ececec] hover:bg-[#171717] font-medium px-4 py-3 rounded-lg transition-colors"
                        >
                            <MessageCircle className="inline h-4 w-4 mr-2" />
                            Feedback
                        </button>
                        <div className="border-t border-[#2e2e2e] my-2 pt-2">
                            {user ? (
                                <>
                                    {credits !== null && (
                                        <div className="flex items-center space-x-2 px-4 py-3 bg-[#171717] rounded-lg mx-2 mb-2">
                                            <Coins className="h-5 w-5 text-white" />
                                            <span className="text-sm font-semibold text-[#ececec]">Credits: {credits}</span>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 py-3 px-4"
                                        onClick={() => {
                                            signOut()
                                            setIsMenuOpen(false)
                                        }}
                                    >
                                        <LogOut className="h-5 w-5 mr-3" />
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-2 px-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center py-3 text-base border-[#2e2e2e] text-[#a1a1a1] hover:bg-[#171717]"
                                        asChild
                                    >
                                        <Link
                                            href="/auth/login"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                    </Button>
                                    <Button
                                        className="w-full justify-center py-3 text-base bg-white hover:bg-gray-100 text-black border border-[#2e2e2e]"
                                        asChild
                                    >
                                        <Link
                                            href="/auth/signup"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Get Started
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Credits Modal */}
            {showCreditsModal && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
                    onClick={() => setShowCreditsModal(false)}
                >
                    <div
                        className="bg-[#171717] rounded-xl max-w-md w-full p-6 border border-[#2e2e2e]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <Coins className="h-8 w-8 text-black" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#ececec] mb-2">Your Credits</h3>
                            <div className="text-5xl font-bold text-white mb-4">{credits}</div>
                            <p className="text-[#a1a1a1] mb-6 text-sm">
                                {credits === 0 ? 'You have no credits remaining.' :
                                    credits === 1 ? 'You have 1 credit remaining.' :
                                        `You have ${credits} credits remaining.`}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setShowCreditsModal(false)}
                                className="w-full border-[#2e2e2e] text-[#a1a1a1] hover:bg-[#212121]"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
                    onClick={() => setShowFeedbackModal(false)}
                >
                    <div
                        className="bg-[#0d0d0d] rounded-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#0d0d0d] p-4 border-b border-[#2e2e2e] flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-[#ececec]">Share Your Feedback</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFeedbackModal(false)}
                                className="text-[#666] hover:text-[#ececec] hover:bg-[#171717]"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <FeedbackForm />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}