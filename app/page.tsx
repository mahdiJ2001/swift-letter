import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JobDescriptionForm from '@/components/JobDescriptionForm'
import AIDetectorCarousel from '@/components/AIDetectorCarousel'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Clock, Sparkles, Target, Rocket, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
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
            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-8 pb-8 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        {/* Premium Tag */}
                        <div className="inline-flex items-center gap-2 premium-badge px-4 py-2 rounded-full mb-6">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">AI-Powered Cover Letter Generator</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 mb-4 tracking-tight leading-[1.1]">
                            Create{' '}
                            <span className="premium-gradient-text">Professional</span>
                            <br className="hidden sm:block" />
                            Cover Letters in Seconds
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed font-light px-2">
                            Generate personalized, ATS-optimized cover letters with human-like writing that bypasses AI detection.
                            Perfect for mass job applications.
                        </p>

                        {/* Key Features Badges */}
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-12 md:mb-16 px-2">
                            <div className="premium-badge flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">30-Second Generation</span>
                            </div>
                            <div className="premium-badge flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">Undetectable by AI</span>
                            </div>
                            <div className="premium-badge flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">Personalized</span>
                            </div>
                            <div className="premium-badge flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">ATS-Optimized</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Job Description Form */}
                <section id="generator" className="py-2 px-4 sm:px-6 scroll-mt-20">
                    <div className="max-w-6xl mx-auto">
                        <JobDescriptionForm />
                    </div>
                </section>

                {/* AI Detector Bypass Section */}
                <AIDetectorCarousel />

                {/* How It Works */}
                <section className="py-24 px-4 sm:px-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent"></div>
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
                            <div className="inline-flex items-center gap-2 premium-badge px-4 py-2 rounded-full mb-4">
                                <Sparkles className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">Simple Process</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                                How It Works
                            </h2>
                            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                                Three simple steps to create your perfect cover letter
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Step 1 */}
                            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl font-bold text-white">1</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Add Your Details
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Share your relevant experience, skills, and achievements. The more context you provide, the better your cover letter.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl font-bold text-white">2</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Paste Job Description
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Simply copy and paste the job posting you're applying for. Our AI will analyze the requirements and key skills.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="glass-card rounded-2xl p-8 text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl font-bold text-white">3</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Get Your Cover Letter
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Receive a professional, personalized cover letter in seconds. Download, customize if needed, and submit with confidence.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Solve Section */}
                <section className="py-24 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
                            <div className="inline-flex items-center gap-2 premium-badge px-4 py-2 rounded-full mb-4">
                                <Sparkles className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">Why Choose Us</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                                Perfect for Mass Applications
                            </h2>
                            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
                                Whether you're applying to 10 jobs or 100, our tool helps you create unique, personalized cover letters for each application in seconds.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            {/* Problems */}
                            <div className="glass-card rounded-2xl p-8 border-red-100/50">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                        <span className="text-red-500 text-lg">✗</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Traditional Approach</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-red-500 text-sm">✗</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Generic Templates</h4>
                                            <p className="text-slate-600 text-sm">Using the same template for every job makes you blend in with hundreds of other applicants, and often gets denied by AI detectors.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-red-500 text-sm">✗</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Time-Consuming Writing</h4>
                                            <p className="text-slate-600 text-sm">Spending hours crafting individual cover letters limits the number of applications you can submit.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-red-500 text-sm">✗</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Missing Keywords</h4>
                                            <p className="text-slate-600 text-sm">Not addressing specific job requirements and keywords can get your application filtered out by ATS systems.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Solutions */}
                            <div className="glass-card-strong rounded-2xl p-8 border-emerald-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
                                <div className="flex items-center gap-3 mb-8 relative z-10">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <span className="text-white text-lg">✓</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Swift Letter Solution</h3>
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Personalized Content</h4>
                                            <p className="text-slate-600 text-sm">Every letter is uniquely crafted to match the specific job requirements and company culture.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">Lightning Speed</h4>
                                            <p className="text-slate-600 text-sm">Generate professional cover letters in seconds, allowing you to apply to more positions in less time.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">ATS Optimization</h4>
                                            <p className="text-slate-600 text-sm">Our AI ensures your cover letter includes relevant keywords and formatting that passes ATS screening.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 sm:mb-8 border border-white/20">
                            <Rocket className="h-4 w-4 text-white" />
                            <span className="text-sm font-medium text-white/90">Start Your Journey</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                            Ready to Stand Out?
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-emerald-100 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto">
                            Join thousands of job seekers who've landed interviews with our AI-powered cover letters.
                        </p>
                        <Link href="#generator">
                            <Button
                                size="lg"
                                className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-10 py-6 h-auto rounded-xl font-semibold shadow-xl shadow-emerald-900/20 hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <span>Start Creating Now</span>
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}