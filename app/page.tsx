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
                            Generate Custom{' '}
                            <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">Cover Letters</span>{' '}
                            & Land Your Dream Job
                        </h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
                            Swift Letter converts your job descriptions into fully personalized,
                            professional cover letters—ensuring they pass every screening tool.
                        </p>
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
                                    Paste Job Description
                                </h3>
                                <p className="text-gray-600">
                                    Simply copy and paste the job description you're applying for into our form.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Complete Your Profile
                                </h3>
                                <p className="text-gray-600">
                                    Fill in your professional details, skills, and experience once.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-green-600">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Get Your Cover Letter
                                </h3>
                                <p className="text-gray-600">
                                    Receive a tailored, professional cover letter ready to send.
                                </p>
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