'use client'

import Image from 'next/image'
import { Shield, ExternalLink } from 'lucide-react'

const aiDetectors = [
    {
        name: 'GPTZero',
        logo: '/logos/gptzero.svg',
        url: 'https://gptzero.me'
    },
    {
        name: 'QuillBot',
        logo: '/logos/quillbot.svg',
        url: 'https://quillbot.com/ai-content-detector'
    },
    {
        name: 'Scribbr',
        logo: '/logos/scribbr.svg',
        url: 'https://scribbr.com/ai-detector'
    },
    {
        name: 'Proofademic',
        logo: '/logos/proofademic.svg',
        url: 'https://proofademic.ai/'
    }
]

// Duplicate for seamless infinite scroll
const duplicatedDetectors = [...aiDetectors, ...aiDetectors, ...aiDetectors]

export default function AIDetectorCarousel() {
    return (
        <section className="py-16 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 premium-badge px-4 py-2 rounded-full mb-4">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Undetectable AI Writing</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Bypasses All Major AI Detectors
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Our human-like writing style passes through the most popular AI detection tools.
                    </p>
                </div>

                {/* Infinite Scrolling Carousel */}
                <div className="relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                    {/* Carousel Track */}
                    <div className="overflow-hidden">
                        <div className="flex animate-scroll gap-16 py-8">
                            {duplicatedDetectors.map((detector, index) => (
                                <a
                                    key={`${detector.name}-${index}`}
                                    href={detector.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 group"
                                >
                                    <div className="relative w-40 h-16 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300">
                                        <Image
                                            src={detector.logo}
                                            alt={`${detector.name} AI Detector Logo`}
                                            width={140}
                                            height={40}
                                            className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                        />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-6 mt-12">
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm font-medium">100% Human-Like Writing</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm font-medium">Natural Conversational Tone</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm font-medium">No Robotic Patterns</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
