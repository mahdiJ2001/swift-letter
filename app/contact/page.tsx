'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Mail, User } from 'lucide-react'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        if (!formData.name || !formData.email || !formData.message) {
            setError('Please fill in all required fields.')
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message')
            }

            setSuccess(true)
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
            })

            setTimeout(() => {
                setSuccess(false)
            }, 5000)
        } catch (error: any) {
            setError(error.message || 'An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 sm:py-20 max-w-6xl">
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#ececec] mb-3 sm:mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-[#a1a1a1] max-w-2xl mx-auto px-2">
                        Have a question, suggestion, or need help? We'd love to hear from you.
                    </p>
                </div>

                {/* Founder Contact Card */}
                <div className="max-w-xl mx-auto mb-8 sm:mb-12">
                    <Card className="border-[#2e2e2e] bg-[#171717]">
                        <CardContent className="p-6 sm:p-8">
                            <div className="text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold text-[#ececec] mb-2">Talk to the Founder</h2>
                                <p className="text-[#a1a1a1] mb-4 text-sm sm:text-base">Get direct access to Mahdi, the founder of Swift Letter</p>
                                <a
                                    href="https://x.com/mahdi_builds"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    <span className="mr-2">@</span>
                                    Message on X (Twitter)
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="max-w-xl mx-auto">
                    <Card className="border-[#2e2e2e] bg-[#171717]">
                        <CardHeader className="text-center pb-4 sm:pb-8 px-4 sm:px-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-[#ececec]">
                                Send us a Message
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base text-[#a1a1a1]">
                                Fill out the form below and we'll get back to you within 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                            <User className="h-4 w-4 inline mr-1" />
                                            Name *
                                        </label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Your full name"
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                            <Mail className="h-4 w-4 inline mr-1" />
                                            Email *
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="your.email@example.com"
                                            className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <MessageSquare className="h-4 w-4 inline mr-1" />
                                        Subject
                                    </label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        type="text"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="What is this regarding?"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <Send className="h-4 w-4 inline mr-1" />
                                        Message *
                                    </label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us how we can help you..."
                                        className="min-h-[150px] resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                {/* Error and Success Messages */}
                                {error && (
                                    <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 px-6 py-4 rounded-r-lg">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-sm font-bold">!</span>
                                            </div>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-emerald-900/30 border-l-4 border-emerald-500 text-emerald-400 px-6 py-4 rounded-r-lg">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-sm font-bold">✓</span>
                                            </div>
                                            <span className="font-medium">Message sent successfully!</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-center pt-4 sm:pt-6 border-t border-[#2e2e2e]">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="w-full sm:w-auto sm:min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-[#2e2e2e] py-6">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-[#666] text-sm">
                        © 2024 Swift Letter. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
