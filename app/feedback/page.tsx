'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import Header from '@/components/Header'

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
            const { error } = await supabase
                .from('user_feedback')
                .insert([
                    {
                        user_id: user?.id || null,
                        feedback: feedback.trim()
                    }
                ])

            if (error) throw error

            setSuccess('Thank you for your feedback! We appreciate your input.')
            setFeedback('')
        } catch (error: any) {
            console.error('Error submitting feedback:', error)
            setError('Failed to submit feedback. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
            <Header />

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <MessageSquare className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                            Share Your Feedback
                        </h1>
                        <p className="text-secondary-600">
                            Help us improve Swift Letter by sharing your thoughts, suggestions, or reporting any issues.
                        </p>
                    </div>

                    <Card className="shadow-lg border-0 bg-white">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl font-semibold text-secondary-900">
                                Your Feedback Matters
                            </CardTitle>
                            <CardDescription>
                                {user ?
                                    "Your feedback will be associated with your account." :
                                    "You can submit feedback anonymously or sign in to track your submissions."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="feedback" className="block text-sm font-medium text-secondary-700 mb-2">
                                        Your Feedback
                                    </label>
                                    <Textarea
                                        id="feedback"
                                        rows={8}
                                        className="resize-none w-full"
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
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-600 text-sm">{success}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="text-center">
                                    <Button
                                        type="submit"
                                        disabled={!feedback.trim() || isSubmitting}
                                        size="lg"
                                        className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Submitting Feedback...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
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