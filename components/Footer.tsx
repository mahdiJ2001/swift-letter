import Link from 'next/link'
import { MessageCircle, Github, Twitter, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-secondary-900 text-secondary-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <MessageCircle className="h-8 w-8 text-primary-400" />
                            <span className="text-xl font-bold text-white">Swift Letter</span>
                        </div>
                        <p className="text-secondary-400 max-w-md">
                            Generate professional cover letters tailored to your profile and job descriptions.
                            Land your dream job with personalized, AI-powered cover letters.
                        </p>
                        <div className="flex space-x-4 mt-6">
                            <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-secondary-400 hover:text-primary-400 transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="hover:text-primary-400 transition-colors">
                                    Cover Letter Generator
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="hover:text-primary-400 transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/feedback" className="hover:text-primary-400 transition-colors">
                                    Feedback
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="hover:text-primary-400 transition-colors">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary-400 transition-colors">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary-400 transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary-400 transition-colors">
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-secondary-800 mt-8 pt-8 text-center">
                    <p className="text-secondary-400">
                        © 2024 Swift Letter. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}