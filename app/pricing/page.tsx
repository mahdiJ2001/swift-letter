import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedbackForm from '@/components/FeedbackForm'
import { Check, Star, CreditCard, Zap, Shield, Clock, Users, TrendingUp, Target } from 'lucide-react'

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 via-green-50 to-white">
            <Header />

            <main>
                {/* Hero Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                            Simple, Transparent{' '}
                            <span className="gradient-text">Pricing</span>
                        </h1>
                        <p className="text-xl text-secondary-600 mb-12 max-w-3xl mx-auto">
                            Choose the perfect plan for your job search needs. Get more credits, save more money.
                        </p>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Starter Plan */}
                            <div className="card">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Zap className="h-8 w-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">Starter</h3>
                                    <p className="text-secondary-600 mb-6">Perfect for trying out Swift Letter</p>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-secondary-900">$4.99</span>
                                    </div>

                                    <div className="text-center mb-6">
                                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                                            5 Cover Letters
                                        </span>
                                    </div>

                                    <ul className="text-left space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">5 AI-generated cover letters</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">ATS-optimized content</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">PDF download</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">Email support</span>
                                        </li>
                                    </ul>

                                    <button className="btn-secondary w-full">
                                        Get Started
                                    </button>
                                </div>
                            </div>

                            {/* Professional Plan - Most Popular */}
                            <div className="card border-2 border-primary-600 relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                                        <Star className="h-4 w-4 mr-1" />
                                        Most Popular
                                    </span>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Target className="h-8 w-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">Professional</h3>
                                    <p className="text-secondary-600 mb-6">Ideal for active job seekers</p>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-secondary-900">$15.99</span>
                                        <div className="text-sm text-secondary-500 mt-1">
                                            <span className="line-through">$19.99</span> Save 20%
                                        </div>
                                    </div>

                                    <div className="text-center mb-6">
                                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            20 Cover Letters
                                        </span>
                                    </div>

                                    <ul className="text-left space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">20 AI-generated cover letters</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">ATS-optimized content</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">PDF download</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">Priority support</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">Custom templates</span>
                                        </li>
                                    </ul>

                                    <button className="btn-primary w-full">
                                        Get Professional
                                    </button>
                                </div>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="card">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <TrendingUp className="h-8 w-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-secondary-900 mb-2">Enterprise</h3>
                                    <p className="text-secondary-600 mb-6">For serious job hunters and recruiters</p>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-secondary-900">$34.99</span>
                                        <div className="text-sm text-secondary-500 mt-1">
                                            <span className="line-through">$49.99</span> Save 30%
                                        </div>
                                    </div>

                                    <div className="text-center mb-6">
                                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                                            50 Cover Letters
                                        </span>
                                    </div>

                                    <ul className="text-left space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">50 AI-generated cover letters</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">ATS-optimized content</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">PDF download</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">24/7 priority support</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">Premium templates</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-4 w-4 text-primary-600 mr-3 flex-shrink-0" />
                                            <span className="text-secondary-600">Bulk generation</span>
                                        </li>
                                    </ul>

                                    <button className="btn-secondary w-full">
                                        Get Enterprise
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Comparison */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                                Why Choose Swift Letter?
                            </h2>
                            <p className="text-xl text-secondary-600">
                                Everything you need to create professional cover letters that get you hired
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                                    Lightning Fast
                                </h3>
                                <p className="text-secondary-600">
                                    Generate professional cover letters in under 30 seconds. No more hours of writing and editing.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Shield className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                                    ATS Optimized
                                </h3>
                                <p className="text-secondary-600">
                                    Our AI ensures your cover letters pass Applicant Tracking Systems used by 99% of companies.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="h-8 w-8 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                                    Trusted by Thousands
                                </h3>
                                <p className="text-secondary-600">
                                    Join over 10,000 job seekers who have successfully landed interviews with Swift Letter.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                                Frequently Asked Questions
                            </h2>
                        </div>

                        <div className="space-y-6">
                            <div className="card">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                                    How do credits work?
                                </h3>
                                <p className="text-secondary-600">
                                    Each cover letter generation uses 1 credit. Credits don't expire and can be used anytime.
                                    You can purchase more credits whenever you need them.
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                                    Can I customize the generated cover letters?
                                </h3>
                                <p className="text-secondary-600">
                                    Yes! While our AI generates personalized cover letters based on your profile and the job description,
                                    you can always edit and customize them before downloading.
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                                    What if I'm not satisfied with a generated cover letter?
                                </h3>
                                <p className="text-secondary-600">
                                    We stand behind our quality. If you're not satisfied with a generated cover letter,
                                    contact our support team and we'll work with you to make it right.
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                                    Do you offer refunds?
                                </h3>
                                <p className="text-secondary-600">
                                    We offer a 7-day money-back guarantee on all purchases. If you're not completely satisfied,
                                    contact us within 7 days for a full refund.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feedback Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                                Help Us Improve
                            </h2>
                            <p className="text-xl text-secondary-600">
                                Your feedback helps us make Swift Letter better for everyone
                            </p>
                        </div>

                        <FeedbackForm />
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Land Your Dream Job?
                        </h2>
                        <p className="text-xl text-primary-100 mb-8">
                            Join thousands of successful job seekers who've used Swift Letter to get hired.
                        </p>
                        <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors">
                            Start Creating Cover Letters
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}