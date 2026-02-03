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
            <div className="min-h-screen bg-[#0d0d0d]">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-[#a1a1a1]">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return null // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d]">
            <Header />

            <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#ececec] mb-2">
                        Welcome back, {session.user.user_metadata?.full_name || session.user.email}!
                    </h1>
                    <p className="text-[#a1a1a1]">
                        Manage your profile and generate cover letters with ease.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link
                        href="/profile"
                        className="bg-[#171717] p-6 rounded-lg border border-[#2e2e2e] hover:border-[#3e3e3e] transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#ececec]">Profile</h3>
                                <p className="text-sm text-[#666]">Update your information</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="bg-[#171717] p-6 rounded-lg border border-[#2e2e2e] hover:border-[#3e3e3e] transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#ececec]">Generate Letter</h3>
                                <p className="text-sm text-[#666]">Create a cover letter</p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-[#171717] p-6 rounded-lg border border-[#2e2e2e]">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-900/30 rounded-lg">
                                <CreditCard className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#ececec]">Credits</h3>
                                <p className="text-sm text-[#666]">5 remaining</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#171717] p-6 rounded-lg border border-[#2e2e2e]">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-900/30 rounded-lg">
                                <Settings className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#ececec]">Settings</h3>
                                <p className="text-sm text-[#666]">Account preferences</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#171717] rounded-lg border border-[#2e2e2e]">
                    <div className="px-6 py-4 border-b border-[#2e2e2e]">
                        <h2 className="text-lg font-medium text-[#ececec]">Recent Activity</h2>
                    </div>
                    <div className="p-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-[#666] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[#ececec] mb-2">No cover letters yet</h3>
                            <p className="text-[#a1a1a1] mb-4">
                                Start by creating your first cover letter
                            </p>
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-100 transition-colors"
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