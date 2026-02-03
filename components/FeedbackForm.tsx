'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { MessageCircle, Send, Star, Camera, X } from 'lucide-react'

export default function FeedbackForm() {
    const [feedback, setFeedback] = useState('')
    const [rating, setRating] = useState(0)
    const [screenshot, setScreenshot] = useState<File | null>(null)
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const { user } = useAuth()

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Screenshot must be less than 5MB')
                return
            }
            setScreenshot(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setScreenshotPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeScreenshot = () => {
        setScreenshot(null)
        setScreenshotPreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feedback.trim()) return

        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('feedback', feedback.trim())
            formData.append('rating', rating.toString())
            if (user?.id) {
                formData.append('userId', user.id)
            }
            if (screenshot) {
                formData.append('screenshot', screenshot)
            }

            const response = await fetch('/api/feedback', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit feedback')
            }

            setSuccess(data.message || 'Thank you for your feedback! We appreciate your input.')
            setFeedback('')
            setRating(0)
            setScreenshot(null)
            setScreenshotPreview(null)
        } catch (error: any) {
            setError(error.message || 'Failed to submit feedback')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-[#171717] border border-[#2e2e2e] rounded-lg p-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#ececec] mb-2">
                    Share Your Feedback
                </h3>
                <p className="text-[#a1a1a1]">
                    Help us improve Swift Letter by sharing your thoughts, suggestions, or reporting issues.
                </p>
            </div>

            {success && (
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-4 mb-6">
                    <p className="text-emerald-300 text-sm">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-[#ececec] mb-3">
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
                                    : 'text-[#666] hover:text-yellow-400'
                                    }`}
                            >
                                <Star className="h-8 w-8 fill-current" />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-[#a1a1a1] mt-2">
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
                    <label htmlFor="feedback" className="block text-sm font-medium text-[#ececec] mb-2">
                        Your Feedback *
                    </label>
                    <textarea
                        id="feedback"
                        name="feedback"
                        rows={6}
                        required
                        className="w-full resize-none bg-[#212121] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#ececec] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Tell us about your experience, suggestions for improvement, or report any issues you've encountered..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="flex justify-between mt-2">
                        <p className="text-sm text-[#a1a1a1]">
                            Your feedback helps us make Swift Letter better for everyone
                        </p>
                        <span className="text-sm text-[#666]">
                            {feedback.length} characters
                        </span>
                    </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                    <label className="block text-sm font-medium text-[#ececec] mb-2">
                        Add a Screenshot (Optional)
                    </label>
                    {!screenshotPreview ? (
                        <div className="border-2 border-dashed border-[#2e2e2e] rounded-lg p-6 text-center hover:border-[#3e3e3e] transition-colors">
                            <Camera className="h-8 w-8 text-[#666] mx-auto mb-2" />
                            <p className="text-sm text-[#a1a1a1] mb-2">
                                Upload a screenshot to help us better understand your feedback
                            </p>
                            <label className="inline-flex items-center px-4 py-2 bg-[#212121] border border-[#2e2e2e] rounded-lg text-sm text-[#ececec] hover:bg-[#2e2e2e] transition-colors cursor-pointer">
                                <Camera className="h-4 w-4 mr-2" />
                                Choose Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-[#666] mt-2">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={screenshotPreview}
                                alt="Screenshot preview"
                                className="max-w-full h-48 object-contain rounded-lg border border-[#2e2e2e]"
                            />
                            <button
                                type="button"
                                onClick={removeScreenshot}
                                className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
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
                    <p className="text-xs text-[#666]">
                        {user ? (
                            'Your feedback will be associated with your account for follow-up purposes.'
                        ) : (
                            'Anonymous feedback is welcome. Sign in if you\'d like us to follow up with you.'
                        )}
                    </p>
                </div>
            </form>

            {/* Feedback Categories */}
            <div className="mt-8 pt-6 border-t border-[#2e2e2e]">
                <h4 className="font-semibold text-[#ececec] mb-4">What kind of feedback are you sharing?</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-[#212121] rounded-lg border border-[#2e2e2e]">
                        <span className="text-[#ececec] font-medium">🐛 Bug Report</span>
                    </div>
                    <div className="text-center p-3 bg-[#212121] rounded-lg border border-[#2e2e2e]">
                        <span className="text-[#ececec] font-medium">💡 Feature Request</span>
                    </div>
                    <div className="text-center p-3 bg-[#212121] rounded-lg border border-[#2e2e2e]">
                        <span className="text-[#ececec] font-medium">👍 General Feedback</span>
                    </div>
                    <div className="text-center p-3 bg-[#212121] rounded-lg border border-[#2e2e2e]">
                        <span className="text-[#ececec] font-medium">❓ Questions</span>
                    </div>
                </div>
            </div>
        </div>
    )
}