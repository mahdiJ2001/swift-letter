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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2">
                            <FileText className="h-8 w-8 text-green-600" />
                            <span className="text-xl font-bold text-gray-900">Swift Letter</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                            >
                                Generator
                            </Link>
                            <Link
                                href="/profile"
                                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                            >
                                Profile
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/feedback"
                                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="text-center">
                            <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Credits</h3>
                            <div className="text-4xl font-bold text-green-600 mb-4">{credits}</div>
                            <p className="text-gray-600 mb-6">
                                {credits === 0 ? 'You have no credits remaining.' :
                                    credits === 1 ? 'You have 1 credit remaining.' :
                                        `You have ${credits} credits remaining.`}
                            </p>
                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreditsModal(false)}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                                <Button
                                    asChild
                                    className="flex-1 bg-green-600 hover:bg-green-700"
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