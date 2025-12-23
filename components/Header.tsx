'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, FileText, User, LogOut, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showCreditsModal, setShowCreditsModal] = useState(false)
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
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm shadow-slate-200/50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:shadow-emerald-300/60 transition-all duration-300">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">Swift Letter</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                href="/"
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-200"
                            >
                                Generator
                            </Link>
                            <Link
                                href="/profile"
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-200"
                            >
                                Profile
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-200"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/feedback"
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors duration-200"
                            >
                                Feedback
                            </Link>
                        </nav>
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                {credits !== null && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCreditsModal(true)}
                                        className="flex items-center space-x-1 px-2 py-1 bg-green-50 hover:bg-green-100 rounded-md border border-green-200 text-green-700 hover:text-green-800"
                                    >
                                        <Star className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium">{credits}</span>
                                    </Button>
                                )}
                                <Button variant="ghost" asChild>
                                    <Link href="/profile" className="flex items-center space-x-2">
                                        <User className="h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={signOut}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span>Sign Out</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/auth/login">
                                        Sign In
                                    </Link>
                                </Button>
                                <Button asChild>
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
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
                        <Link
                            href="/"
                            className="block text-gray-600 hover:text-green-600 font-medium transition-colors px-2 py-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Generator
                        </Link>
                        <Link
                            href="/profile"
                            className="block text-gray-600 hover:text-green-600 font-medium transition-colors px-2 py-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Profile
                        </Link>
                        <Link
                            href="/pricing"
                            className="block text-gray-600 hover:text-green-600 font-medium transition-colors px-2 py-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/feedback"
                            className="block text-gray-600 hover:text-green-600 font-medium transition-colors px-2 py-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Feedback
                        </Link>
                        {user ? (
                            <>
                                {credits !== null && (
                                    <div className="flex items-center space-x-2 px-2 py-2">
                                        <Star className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">Credits: {credits}</span>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        signOut()
                                        setIsMenuOpen(false)
                                    }}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start"
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
                                    className="w-full"
                                    asChild
                                >
                                    <Link
                                        href="/auth/signup"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Credits Modal */}
            {showCreditsModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 min-h-screen"
                    onClick={() => setShowCreditsModal(false)}
                >
                    <div
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-100 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Star className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Credits</h3>
                            <div className="text-5xl font-bold bg-gradient-to-br from-green-500 to-green-700 bg-clip-text text-transparent mb-4">{credits}</div>
                            <p className="text-gray-600 mb-6 text-sm">
                                {credits === 0 ? 'You have no credits remaining. Purchase more to continue generating cover letters.' :
                                    credits === 1 ? 'You have 1 credit remaining.' :
                                        `You have ${credits} credits remaining.`}
                            </p>
                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreditsModal(false)}
                                    className="flex-1 hover:bg-gray-50"
                                >
                                    Close
                                </Button>
                                <Button
                                    asChild
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                                >
                                    <Link href="/pricing" onClick={() => setShowCreditsModal(false)}>
                                        Buy Credits
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}