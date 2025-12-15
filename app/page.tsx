import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JobDescriptionForm from '@/components/JobDescriptionForm'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
            <Header />
            <div className="h-10 sm:h-14" />
            <main>
                {/* Hero Section */}
                <section className="pt-12 pb-6 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                            Generate{' '}
                            <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">Human-Like</span>{' '}
                            Personalized Cover Letters in Seconds
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
                            The only AI tool that creates truly personalized cover letters that sound naturally human-written, not robotic. Perfect for mass job applications - each letter is uniquely tailored to match your experience with specific job requirements.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-md border border-green-100">
                                <Zap className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-sm font-semibold text-gray-800">100% Personalized Content</span>
                            </div>
                            <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-md border border-green-100">
                                <Shield className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-sm font-semibold text-gray-800">Sounds Human-Written</span>
                            </div>
                            <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-md border border-green-100">
                                <Clock className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-sm font-semibold text-gray-800">Generated in 30 Seconds</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Job Description Form */}
                <section className="py-2 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <JobDescriptionForm />
                    </div>
                </section>                {/* How It Works */}
                <section className="py-20 px-4 sm:px-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                            How It Works
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">1</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Upload Resume & Job Description
                                </h3>
                                <p className="text-gray-600">
                                    Upload your resume or fill your profile once, then paste any job description. Our AI analyzes both to understand the perfect match.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    AI Creates Human-Like, Personalized Letters
                                </h3>
                                <p className="text-gray-600">
                                    Our advanced AI doesn't use templates. It writes each letter from scratch, matching your specific experience with job requirements to create natural, conversational content that recruiters can't tell was AI-generated.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Download Professional PDF
                                </h3>
                                <p className="text-gray-600">
                                    Get a beautifully formatted, ATS-friendly PDF cover letter ready to submit. Edit and regenerate as many times as needed.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Solve Section */}
                <section className="py-20 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Perfect for Mass Job Applications
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Unlike other tools, we generate truly personalized content that sounds human-written - not robotic templates that recruiters instantly recognize as AI-generated.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="space-y-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 text-xl">✗</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Robotic AI-Generated Letters Recruiters Spot Instantly</h3>
                                            <p className="text-gray-600">Most AI tools generate obvious, template-based content that sounds robotic and gets immediately flagged by recruiters as AI-written.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 text-xl">✗</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Time-Consuming Manual Writing</h3>
                                            <p className="text-gray-600">Writing personalized cover letters from scratch takes hours and often sounds robotic or unprofessional.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 text-xl">✗</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS Rejection Due to Poor Formatting</h3>
                                            <p className="text-gray-600">Many cover letters get rejected by Applicant Tracking Systems due to incompatible formats or missing keywords.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="space-y-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 text-xl">✓</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Human-Like, Personalized Letters That Pass Every Test</h3>
                                            <p className="text-gray-600">Our AI creates genuinely personalized content that sounds naturally human-written. Each letter reads like you personally wrote it, using your specific experience and casual, conversational language.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 text-xl">✓</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated in Seconds, Not Minutes</h3>
                                            <p className="text-gray-600">Upload your resume once, paste any job description, and get a professional cover letter in under 30 seconds.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 text-xl">✓</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS-Optimized Professional Format</h3>
                                            <p className="text-gray-600">Every cover letter is generated in a clean, professional PDF format that passes through all major ATS systems.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 sm:px-6 bg-green-600">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Land Your Dream Job?
                        </h2>
                        <p className="text-xl text-green-100 mb-8">
                            Join thousands of job seekers who've successfully landed interviews with Swift Letter.
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 py-4 h-auto"
                        >
                            <span>Start Generating</span>
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}