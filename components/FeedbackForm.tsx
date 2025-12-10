'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { MessageCircle, Send, Star } from 'lucide-react'

export default function FeedbackForm() {
    const [feedback, setFeedback] = useState('')
    const [rating, setRating] = useState(0)
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
                feedback: `${rating > 0 ? `Rating: ${rating}/5 stars\n` : ''}${feedback.trim()}`,
            }

            const { error } = await supabase
                .from('user_feedback')
                .insert(feedbackData as any)

            if (error) throw error

            setSuccess('Thank you for your feedback! We appreciate your input.')
            setFeedback('')
            setRating(0)
        } catch (error: any) {
            setError(error.message || 'Failed to submit feedback')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="card max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                    Share Your Feedback
                </h3>
                <p className="text-secondary-600">
                    Help us improve Swift Letter by sharing your thoughts, suggestions, or reporting issues.
                </p>
            </div>

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-600 text-sm">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-3">
                        How would you rate your experience? (Optional)
                    </label>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`p-1 rounded-md transition-colors ${star <= rating
                                    ? 'text-yellow-400 hover:text-yellow-500'
                                    : 'text-secondary-300 hover:text-yellow-400'
                                    }`}
                            >
                                <Star className="h-8 w-8 fill-current" />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-secondary-500 mt-2">
                            {rating === 1 && 'Poor - We\'ll work to improve'}
                            {rating === 2 && 'Fair - There\'s room for improvement'}
                            {rating === 3 && 'Good - Pretty satisfied'}
                            {rating === 4 && 'Very Good - Mostly happy'}
                            {rating === 5 && 'Excellent - Love it!'}
                        </p>
                    )}
                </div>

                {/* Feedback Text */}
                <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-secondary-700 mb-2">
                        Your Feedback *
                    </label>
                    <textarea
                        id="feedback"
                        name="feedback"
                        rows={6}
                        required
                        className="input-field resize-none"
                        placeholder="Tell us about your experience, suggestions for improvement, or report any issues you've encountered..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="flex justify-between mt-2">
                        <p className="text-sm text-secondary-500">
                            Your feedback helps us make Swift Letter better for everyone
                        </p>
                        <span className="text-sm text-secondary-400">
                            {feedback.length} characters
                        </span>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting}
                        className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                <span>Submit Feedback</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Privacy Note */}
                <div className="text-center">
                    <p className="text-xs text-secondary-500">
                        {user ? (
                            'Your feedback will be associated with your account for follow-up purposes.'
                        ) : (
                            'Anonymous feedback is welcome. Sign in if you\'d like us to follow up with you.'
                        )}
                    </p>
                </div>
            </form>

            {/* Feedback Categories */}
            <div className="mt-8 pt-6 border-t border-secondary-200">
                <h4 className="font-semibold text-secondary-900 mb-4">What kind of feedback are you sharing?</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <span className="text-primary-700 font-medium">🐛 Bug Report</span>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <span className="text-primary-700 font-medium">💡 Feature Request</span>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <span className="text-primary-700 font-medium">👍 General Feedback</span>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <span className="text-primary-700 font-medium">❓ Questions</span>
                    </div>
                </div>
            </div>
        </div>
    )
}