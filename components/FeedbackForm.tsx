'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Send, Camera, X, AlertCircle } from 'lucide-react'

export default function FeedbackForm() {
    const [feedback, setFeedback] = useState('')
    const [screenshot, setScreenshot] = useState<File | null>(null)
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const { user } = useAuth()

    const validateFeedback = (text: string): { isValid: boolean; error?: string } => {
        if (!text || !text.trim()) {
            return { isValid: false, error: 'Feedback is required' }
        }

        const trimmed = text.trim()

        if (trimmed.length < 10) {
            return { isValid: false, error: 'Feedback must be at least 10 characters long' }
        }

        if (trimmed.length > 2000) {
            return { isValid: false, error: 'Feedback must be less than 2000 characters' }
        }

        return { isValid: true }
    }

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                setError('Please select a PNG, JPEG, or WebP image')
                return
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError('Screenshot must be less than 5MB')
                return
            }

            setError('') // Clear any previous errors
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

        // Enhanced validation
        const feedbackValidation = validateFeedback(feedback)
        if (!feedbackValidation.isValid) {
            setError(feedbackValidation.error!)
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('feedback', feedback.trim())
            formData.append('rating', '0') // No rating system
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
                // Handle specific error cases
                if (response.status === 429) {
                    throw new Error('Too many feedback submissions. Please try again in 30 minutes.')
                } else {
                    throw new Error(data.error || 'Failed to submit feedback')
                }
            }

            setSuccess('Thanks for your feedback! We appreciate your input.')
            setFeedback('')
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
            {success && (
                <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 mb-4">
                    <p className="text-emerald-300 text-sm">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback Text */}
                <div>
                    <textarea
                        rows={4}
                        required
                        className="w-full resize-none bg-[#212121] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[#ececec] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="Share your feedback... (minimum 10 characters)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        maxLength={2000}
                    />
                    <div className="flex justify-between items-center mt-1 px-1">
                        <span className={`text-xs ${feedback.length < 10 ? 'text-orange-400' :
                                feedback.length > 1800 ? 'text-yellow-400' :
                                    'text-[#666]'
                            }`}>
                            {feedback.length < 10 && feedback.length > 0 ?
                                `${10 - feedback.length} more characters needed` :
                                feedback.length >= 10 ? '✓ Minimum met' : ''}
                        </span>
                        <span className={`text-xs ${feedback.length > 1800 ? 'text-yellow-400' : 'text-[#666]'
                            }`}>
                            {feedback.length}/2000
                        </span>
                    </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                    {!screenshotPreview ? (
                        <label className="inline-flex items-center px-3 py-2 bg-[#212121] border border-[#2e2e2e] rounded-lg text-sm text-[#ececec] hover:bg-[#2e2e2e] transition-colors cursor-pointer">
                            <Camera className="h-4 w-4 mr-2" />
                            Attach Screenshot
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="relative inline-block">
                            <img
                                src={screenshotPreview}
                                alt="Screenshot preview"
                                className="max-w-full h-32 object-contain rounded-lg border border-[#2e2e2e]"
                            />
                            <button
                                type="button"
                                onClick={removeScreenshot}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                <span>Submit</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}