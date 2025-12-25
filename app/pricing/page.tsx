'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

const pricingPlans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 5,
        credits: 15,
        pricePerLetter: '0.33',
        icon: Zap,
        popular: false,
        color: 'emerald',
        features: [
            '15 AI-generated cover letters',
            'ATS-optimized formatting',
            'PDF download'

        ]
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 15,
        credits: 50,
        pricePerLetter: '0.30',
        icon: Sparkles,
        popular: true,
        color: 'violet',
        features: [
            '50 AI-generated cover letters',
            'ATS-optimized formatting',
            'PDF download'

        ]
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 40,
        credits: 150,
        pricePerLetter: '0.27',
        icon: Crown,
        popular: false,
        color: 'amber',
        features: [
            '150 AI-generated cover letters',
            'ATS-optimized formatting',
            'PDF download'
        ]
    }
]

export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuth()
    const router = useRouter()

    const handleSelectPlan = async (planId: string) => {
        setSelectedPlan(planId)
        setIsLoading(true)

        if (!user) {
            router.push(`/auth/login?redirectTo=/pricing&plan=${planId}`)
            return
        }

        // TODO: Integrate with Stripe checkout
        setTimeout(() => {
            setIsLoading(false)
            alert(`Payment integration coming soon! Selected plan: ${planId}`)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
            {/* Subtle background pattern */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl" />
            </div>

            <Header />

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full mb-4 sm:mb-6">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Simple, transparent pricing</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
                        Choose your plan
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                        Start with 3 free cover letters. Upgrade anytime to generate more.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
                    {pricingPlans.map((plan) => {
                        const Icon = plan.icon
                        const isSelected = selectedPlan === plan.id

                        return (
                            <div
                                key={plan.id}
                                className={`
                                    relative bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 flex flex-col
                                    ${plan.popular
                                        ? 'ring-2 ring-violet-500 shadow-xl shadow-violet-500/10 sm:scale-105 order-first sm:order-none'
                                        : 'ring-1 ring-slate-200 shadow-lg hover:shadow-xl hover:ring-slate-300'
                                    }
                                `}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="text-center mb-6 sm:mb-8">
                                    <div className={`
                                        w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4
                                        ${plan.popular
                                            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                            : plan.color === 'emerald'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-amber-100 text-amber-600'
                                        }
                                    `}>
                                        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                                    <p className="text-sm text-slate-500">{plan.credits} cover letters</p>
                                </div>

                                {/* Price */}
                                <div className="text-center mb-6 sm:mb-8">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl sm:text-5xl font-bold text-slate-900">${plan.price}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">
                                        ${plan.pricePerLetter} per letter
                                    </p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                                            <div className={`
                                                flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                                                ${plan.popular
                                                    ? 'bg-violet-100 text-violet-600'
                                                    : plan.color === 'emerald'
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : 'bg-amber-100 text-amber-600'
                                                }
                                            `}>
                                                <Check className="h-3 w-3" strokeWidth={3} />
                                            </div>
                                            <span className="text-slate-600 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={isLoading && isSelected}
                                    className={`
                                        w-full py-3 sm:py-3.5 px-6 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200
                                        flex items-center justify-center gap-2 mt-auto
                                        ${plan.popular
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25'
                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {isLoading && isSelected ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Trust Section */}
                <div className="mt-10 sm:mt-16 text-center px-2">
                    <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
                        🔒 Secure payment powered by Stripe • Cancel anytime • No hidden fees
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-8 text-slate-400">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">Instant delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">Credits never expire</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm">Money-back guarantee</span>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16 sm:mt-24 px-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
                        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 ring-1 ring-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Do I get free credits to try?</h3>
                            <p className="text-slate-600 text-xs sm:text-sm">
                                Yes! Every new user gets 3 free cover letters to try the service before purchasing.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 ring-1 ring-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Do credits expire?</h3>
                            <p className="text-slate-600 text-xs sm:text-sm">
                                No, your credits never expire. Use them whenever you need.
                            </p>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}