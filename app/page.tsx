import Header from '@/components/Header'
import JobDescriptionForm from '@/components/JobDescriptionForm'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                {/* Main Content - Centered */}
                <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#ececec] text-center mb-4">
                        Generate Software Engineer Cover Letters Instantly
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base sm:text-lg text-[#a1a1a1] text-center mb-8 max-w-xl">
                        Human-written cover letters customized for software engineering roles, based on your profile. Ready in seconds.
                    </p>

                    {/* Job Description Form */}
                    <JobDescriptionForm />
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-4 text-center text-sm text-[#666]">
                <p>© 2026 Swift Letter. Fast, human-like cover letters.</p>
            </footer>
        </div>
    )
}