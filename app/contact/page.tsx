'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
        setError('')
        setSuccess('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            setError('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setSuccess('Thank you for your message! We\'ll get back to you soon.')
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                })
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to send message. Please try again.')
            }
        } catch (error) {
            setError('Failed to send message. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
            <Header />
            <div className="h-10 sm:h-14" />

            <main className="py-12 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Contact Us
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Have a question, suggestion, or need help? We'd love to hear from you.
                            Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    {/* Founder Direct Contact */}
                    <div className="max-w-xl mx-auto mb-10">
                        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center border border-green-100">
                            <div className="flex items-center mb-2">
                                <span className="text-lg font-semibold text-gray-900 mr-2">Contact the Founder Directly:</span>
                            </div>
                            <div className="flex space-x-4 mt-2">
                                <a href="https://x.com/mahdi_builds" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 bg-green-50 hover:bg-green-100 rounded-full text-green-700 font-medium border border-green-200 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2"><path d="M22.162 5.656c-.793.352-1.645.59-2.54.697a4.48 4.48 0 0 0 1.962-2.475 8.93 8.93 0 0 1-2.828 1.08A4.466 4.466 0 0 0 11.07 9.03c0 .35.04.69.115 1.016C7.728 9.89 4.1 8.1 1.67 5.149c-.384.66-.604 1.426-.604 2.243 0 1.548.788 2.915 1.99 3.717-.732-.023-1.42-.224-2.022-.56v.057c0 2.163 1.54 3.97 3.584 4.378-.375.102-.77.157-1.178.157-.288 0-.563-.027-.834-.08.564 1.76 2.2 3.04 4.14 3.075A8.96 8.96 0 0 1 2 19.54a12.66 12.66 0 0 0 6.86 2.01c8.23 0 12.74-6.82 12.74-12.74 0-.194-.004-.388-.013-.58.875-.63 1.635-1.42 2.235-2.314z"/></svg>
                                    Twitter
                                </a>
                                <a href="https://www.linkedin.com/in/mahdi-jellali-849858285/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 bg-green-50 hover:bg-green-100 rounded-full text-green-700 font-medium border border-green-200 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.966 0-1.75-.79-1.75-1.75s.784-1.75 1.75-1.75 1.75.79 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v5.61z"/></svg>
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-xl mx-auto">
                        {/* Contact Form Only */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-green-600" />
                                    Send us a Message
                                </CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you within 24 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Name *
                                            </label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email *
                                            </label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            type="text"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="What is this regarding?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                            Message *
                                        </label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us how we can help you..."
                                            className="min-h-[120px] resize-none"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-sm text-red-600">{error}</p>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                            <p className="text-sm text-green-600">{success}</p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Sending...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Message
                                            </div>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}