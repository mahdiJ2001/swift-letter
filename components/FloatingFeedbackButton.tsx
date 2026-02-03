'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import FeedbackForm from './FeedbackForm'

export default function FloatingFeedbackButton() {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)

    return (
        <>
            {/* Floating Feedback Button */}
            <button
                onClick={() => setShowFeedbackModal(true)}
                className="fixed bottom-6 right-6 z-40 bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg border-2 border-black/10 hover:scale-110 transition-all duration-200 group"
                aria-label="Open feedback form"
            >
                <MessageCircle className="h-6 w-6" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Send Feedback
                </span>
            </button>

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
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="text-[#666] hover:text-[#ececec] hover:bg-[#171717] p-2 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <FeedbackForm />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}