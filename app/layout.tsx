import { AuthProvider } from '@/lib/auth-context'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Swift Letter - Human-Like AI Cover Letters | Personalized in Seconds | Mass Job Applications',
    description: 'Generate truly personalized cover letters that sound human-written, not AI-generated. Perfect for mass job applications - each letter uniquely matches your experience with job requirements in 30 seconds.',
    keywords: 'human-like cover letters, personalized cover letters, AI cover letter generator, mass job applications, cover letter builder, natural cover letters, non-robotic AI letters, instant cover letters, job application automation, human-sounding AI writing',
    authors: [{ name: 'Swift Letter Team' }],
    openGraph: {
        title: 'Swift Letter - AI Cover Letter Builder | Generate Professional Cover Letters',
        description: 'Create tailored, professional cover letters in seconds with AI. Upload your resume, paste job descriptions, and get personalized cover letters that pass ATS screening.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Swift Letter - AI Cover Letter Builder',
        description: 'Generate professional, ATS-friendly cover letters instantly with AI',
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
        "description": "Generate human-like, personalized cover letters instantly. Perfect for mass job applications with AI that creates natural, non-robotic content.",
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
            "Human-like AI writing that passes recruiter detection",
            "100% personalized content for each application",
            "30-second generation time for mass applications",
            "Natural conversational tone, not robotic templates",
            "Experience matching with job requirements",
            "Professional PDF export"
        ]
    }

    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </head>
            <body className={`${inter.className} min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}