'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
        <div className="min-h-screen flex flex-col premium-bg">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Have a question, suggestion, or need help? We'd love to hear from you.
                    </p>
                </div>

                {/* Founder Contact Card */}
                <div className="max-w-xl mx-auto mb-12">
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
                        <CardContent className="p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <MessageSquare className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Talk to the Founder</h2>
                                <p className="text-gray-600 mb-4">Get direct access to Mahdi, the founder of Swift Letter</p>
                                <a
                                    href="https://x.com/mahdi_builds"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
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
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
                        <CardHeader className="text-center pb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Mail className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                Send us a Message
                            </CardTitle>
                            <CardDescription className="text-base text-gray-600">
                                Fill out the form below and we'll get back to you within 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                                            className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                                            className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        <Send className="h-4 w-4 inline mr-1" />
                                        Message *
                                    </label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us how we can help you..."
                                        className="min-h-[150px] resize-none bg-white border-green-200 focus:border-green-500 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                {/* Error and Success Messages */}
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-md">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-sm font-bold">!</span>
                                            </div>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-r-lg shadow-md">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-white text-sm font-bold">✓</span>
                                            </div>
                                            <span className="font-medium">{success}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-center pt-6 border-t border-green-200">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="min-w-[200px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                                Sending Message...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5 mr-3" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    )
}
