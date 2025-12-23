'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'
import { User, FileText, Settings, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
    const { session, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth/login?redirectTo=/dashboard')
        }
    }, [session, loading, router])

    if (loading) {
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
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect in useEffect
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

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {session.user.user_metadata?.full_name || session.user.email}!
                    </h1>
                    <p className="text-gray-600">
                        Manage your profile and generate cover letters with ease.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link
                        href="/profile"
                        className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <User className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Profile</h3>
                                <p className="text-sm text-gray-500">Update your information</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Generate Letter</h3>
                                <p className="text-sm text-gray-500">Create a cover letter</p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Credits</h3>
                                <p className="text-sm text-gray-500">5 remaining</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Settings className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Settings</h3>
                                <p className="text-sm text-gray-500">Account preferences</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                    </div>
                    <div className="p-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
                            <p className="text-gray-500 mb-4">
                                Start by creating your first cover letter
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Create Cover Letter
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}