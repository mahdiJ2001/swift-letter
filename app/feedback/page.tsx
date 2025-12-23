'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import Header from '@/components/Header'
import type { Database } from '@/types/supabase'

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const { user } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feedback.trim()) return

        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const feedbackData = {
                user_id: user?.id || null,
                feedback: feedback.trim()
            }

            const { error } = await supabase
                .from('user_feedback')
                .insert(feedbackData as any)

            if (error) throw error

            setSuccess('Thank you for your feedback! We appreciate your input and will use it to improve Swift Letter.')
            setFeedback('')
        } catch (error: any) {
            console.error('Error submitting feedback:', error)
            setError('Failed to submit feedback. Please try again later.')
        } finally {
            setIsSubmitting(false)
        }
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

            <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                <div className="text-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Share Your Feedback
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Help us improve Swift Letter by sharing your thoughts and suggestions
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg border-b border-gray-200">
                            <CardTitle className="flex items-center space-x-3 text-xl">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-gray-900">We Value Your Opinion</span>
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-base mt-2">
                                {user ?
                                    "Your feedback will be associated with your account and help us improve." :
                                    "You can submit feedback anonymously or sign in to track your submissions."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-3">
                                        <MessageSquare className="inline h-4 w-4 mr-1" />
                                        Your Feedback
                                    </label>
                                    <Textarea
                                        id="feedback"
                                        rows={8}
                                        className="resize-none w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Share your thoughts about Swift Letter. What works well? What could be improved? Any bugs or issues you've encountered? Feature requests?"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        required
                                    />
                                    <div className="mt-2 text-sm text-gray-500">
                                        {feedback.length} characters
                                    </div>
                                </div>

                                {/* Error and Success Messages */}
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg shadow-sm">
                                        <div className="flex items-center">
                                            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-xs">!</span>
                                            </div>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-r-lg shadow-sm">
                                        <div className="flex items-center">
                                            <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                            <span className="font-medium">{success}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-center pt-6 border-t border-gray-200">
                                    <Button
                                        type="submit"
                                        disabled={!feedback.trim() || isSubmitting}
                                        size="lg"
                                        className="min-w-[200px] bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                                Submitting Feedback...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5 mr-3" />
                                                Submit Feedback
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}