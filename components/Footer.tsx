import Link from 'next/link'
import { FileText, Github, Twitter, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 sm:col-span-2">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-white/80 to-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-white">Swift Letter</span>
                        </div>
                        <p className="text-slate-400 max-w-md leading-relaxed text-sm sm:text-base">
                            Generate professional cover letters tailored to your profile and job descriptions.
                            Land your dream job with personalized, AI-powered cover letters.
                        </p>
                        <div className="flex space-x-3 sm:space-x-4 mt-4 sm:mt-6">
                            <a href="https://www.linkedin.com/in/mahdi-jellali-849858285/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group">
                                <Github className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-hover:text-white transition-colors" />
                            </a>
                            <a href="https://x.com/mahdi_builds" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 hover:bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group">
                                <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Product</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link href="/" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                                    Cover Letter Generator
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/feedback" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                                    Feedback
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Support</h3>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
                    <p className="text-slate-500 text-xs sm:text-sm">
                        © 2026 Swift Letter. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}