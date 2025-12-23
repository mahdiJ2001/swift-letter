'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedbackForm from '@/components/FeedbackForm'
import { Check, Star, CreditCard, Zap, Shield, Clock, Users, TrendingUp, Target } from 'lucide-react'

export default function PricingPage() {
    return (
        <div className="min-h-screen premium-bg">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="floating-orb floating-orb-1"></div>
                <div className="floating-orb floating-orb-2"></div>
                <div className="floating-orb floating-orb-3"></div>
                <div className="grid-pattern"></div>
            </div>
            <Header />

            <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 relative z-10">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Simple, Transparent{' '}
                        <span className="gradient-text">Pricing</span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Choose the perfect plan for your job search needs. Get more credits, save more money.
                    </p>
                </div>

                {/* Pricing Cards */}
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
            </div>

            <Footer />
        </div>
    )
}