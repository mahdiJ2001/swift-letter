import { AuthProvider } from '@/lib/auth-context'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Swift Letter - Custom Cover Letter Generator',
    description: 'Generate professional cover letters tailored to your profile and job descriptions in seconds.',
    keywords: 'cover letter, job application, resume, career, AI generator',
    authors: [{ name: 'Swift Letter Team' }],
}

export const viewport = 'width=device-width, initial-scale=1'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}