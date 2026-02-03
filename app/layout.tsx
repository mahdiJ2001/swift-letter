import { AuthProvider } from '@/lib/auth-context'
import FloatingFeedbackButton from '@/components/FloatingFeedbackButton'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Swift Letter - AI Cover Letter Generator | Human-Like Writing | Undetectable by AI Detectors',
    description: 'Generate personalized, ATS-optimized cover letters in 30 seconds. Human-like writing style that bypasses GPTZero, QuillBot, Scribbr & Proofademic AI detectors. Perfect for mass job applications.',
    keywords: 'AI cover letter generator, undetectable AI writing, human-like cover letters, ATS-optimized cover letters, personalized cover letters, mass job applications, cover letter builder, bypass AI detection, GPTZero undetectable, professional cover letters, job application automation, instant cover letters',
    authors: [{ name: 'Swift Letter Team' }],
    openGraph: {
        title: 'Swift Letter - AI Cover Letter Generator | Undetectable Human-Like Writing',
        description: 'Generate personalized, ATS-optimized cover letters in 30 seconds. Human-like writing that bypasses all major AI detectors. Perfect for mass job applications.',
        type: 'website',
        locale: 'en_US',
        siteName: 'Swift Letter',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Swift Letter - AI Cover Letter Generator',
        description: 'Generate personalized cover letters in 30 seconds. Human-like writing undetectable by AI detectors.',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://swiftletter.com',
    },
    verification: {
        google: 'your-google-verification-code',
    },
}

export const viewport = 'width=device-width, initial-scale=1'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Swift Letter",
        "alternateName": "Swift Letter AI Cover Letter Generator",
        "description": "Generate personalized, ATS-optimized cover letters in 30 seconds. Human-like writing that bypasses AI detectors like GPTZero, QuillBot, Scribbr, and Proofademic.",
        "url": "https://swiftletter.com",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "creator": {
            "@type": "Person",
            "name": "Mahdi Jellali",
            "url": "https://x.com/mahdi_builds"
        },
        "featureList": [
            "30-second cover letter generation",
            "Human-like AI writing undetectable by AI detectors",
            "Bypasses GPTZero, QuillBot, Scribbr, Proofademic",
            "100% personalized content for each job application",
            "ATS-optimized keyword matching",
            "Natural conversational tone",
            "Professional PDF export",
            "Perfect for mass job applications"
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1250"
        }
    }

    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </head>
            <body className={`${inter.className} min-h-screen bg-[#0d0d0d]`}>
                <AuthProvider>
                    {children}
                    <FloatingFeedbackButton />
                </AuthProvider>
            </body>
        </html>
    )
}