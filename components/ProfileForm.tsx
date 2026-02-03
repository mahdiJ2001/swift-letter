'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Save,
    Upload,
    User,
    Mail,
    Phone,
    MapPin,
    Link,
    Briefcase,
    Code,
    GraduationCap,
    Award,
    Globe,
    FileText,
    Sparkles
} from 'lucide-react'

type UserProfile = {
    id: string
    full_name: string
    email: string
    phone: string
    links?: string
    experiences: string
    projects: string
    skills: string
    education?: string
    certifications?: string
    languages?: string
    location?: string
    credits: number
    resume_url?: string
}

interface ProfileFormProps {
    profile: UserProfile | null
    onProfileUpdate: (profile: UserProfile) => void
}

export default function ProfileForm({ profile, onProfileUpdate }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingResume, setIsUploadingResume] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Parse existing links
    const parseLinks = (linksString?: string) => {
        const links = { linkedin: '', github: '', portfolio: '' }
        if (linksString) {
            const lines = linksString.split('\n')
            lines.forEach(line => {
                if (line.toLowerCase().includes('linkedin')) {
                    links.linkedin = line.split(': ')[1] || ''
                } else if (line.toLowerCase().includes('github')) {
                    links.github = line.split(': ')[1] || ''
                } else if (line.toLowerCase().includes('portfolio')) {
                    links.portfolio = line.split(': ')[1] || ''
                }
            })
        }
        return links
    }

    const existingLinks = parseLinks(profile?.links)

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        linkedin: existingLinks.linkedin,
        github: existingLinks.github,
        portfolio: existingLinks.portfolio,
        experiences: profile?.experiences || '',
        projects: profile?.projects || '',
        skills: profile?.skills || '',
        education: profile?.education || '',
        certifications: profile?.certifications || '',
        languages: profile?.languages || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
        setError('')
        setSuccess('')
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }

        setIsUploadingResume(true)
        setError('')
        setSuccess('')

        try {
            // First, upload the file to Supabase storage
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Get the current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('User not authenticated')
            }

            // Generate unique filename
            const fileExt = 'pdf'
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `resumes/${fileName}`

            // Upload file to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('user-files')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Storage upload error:', uploadError)
                throw new Error('Failed to upload resume file')
            }

            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage
                .from('user-files')
                .getPublicUrl(filePath)

            const resumeUrl = urlData.publicUrl

            // Now extract the content from the PDF
            const formData = new FormData()
            formData.append('pdf', file)

            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to extract PDF content')
            }

            const responseData = await response.json()

            // API returns { data: extractedProfile }
            const extractedProfile = responseData.data

            if (extractedProfile) {
                // Format arrays if they're returned as arrays
                const formatArray = (value: any): string => {
                    if (Array.isArray(value)) {
                        return value.join(', ')
                    }
                    return value || ''
                }

                // Update form data with extracted information
                setFormData(prev => ({
                    ...prev,
                    full_name: extractedProfile.full_name || prev.full_name,
                    email: extractedProfile.email || prev.email,
                    phone: extractedProfile.phone || prev.phone,
                    location: extractedProfile.location || prev.location,
                    experiences: extractedProfile.experiences || prev.experiences,
                    projects: extractedProfile.projects || prev.projects,
                    skills: formatArray(extractedProfile.skills) || prev.skills,
                    education: extractedProfile.education || prev.education,
                    certifications: extractedProfile.certifications || prev.certifications,
                    languages: formatArray(extractedProfile.languages) || prev.languages,
                }))

                // Update profile with resume URL immediately
                if (profile) {
                    await updateProfileWithResumeUrl(resumeUrl)
                }

                setSuccess('Resume processed successfully! Review and customize the extracted information.')
            } else {
                throw new Error(responseData.error || 'Failed to extract information from PDF')
            }
        } catch (error: any) {
            console.error('Error uploading resume:', error)
            setError(error.message || 'Failed to process resume. Please try again.')
        } finally {
            setIsUploadingResume(false)
        }
    }

    const updateProfileWithResumeUrl = async (resumeUrl: string) => {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: profile?.id,
                    resume_url: resumeUrl
                }),
            })

            if (response.ok) {
                const updatedProfile = await response.json()
                // Update the profile state to include the resume URL
                onProfileUpdate({
                    ...profile!,
                    resume_url: resumeUrl
                })
            }
        } catch (error) {
            console.error('Failed to update profile with resume URL:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.full_name.trim()) {
            setError('Full name is required')
            return
        }

        if (!formData.email.trim()) {
            setError('Email is required')
            return
        }

        if (!formData.phone.trim()) {
            setError('Phone is required')
            return
        }

        if (!formData.experiences.trim()) {
            setError('Work experience is required')
            return
        }

        if (!formData.skills.trim()) {
            setError('Skills are required')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            // Concatenate links
            const linksArray: string[] = []
            if (formData.linkedin) linksArray.push(`LinkedIn: ${formData.linkedin}`)
            if (formData.github) linksArray.push(`GitHub: ${formData.github}`)
            if (formData.portfolio) linksArray.push(`Portfolio: ${formData.portfolio}`)
            const concatenatedLinks = linksArray.join('\n')

            const profileData = {
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location || null,
                links: concatenatedLinks || null,
                experiences: formData.experiences,
                projects: formData.projects,
                skills: formData.skills,
                education: formData.education || null,
                certifications: formData.certifications || null,
                languages: formData.languages || null,
                updated_at: new Date().toISOString()
            }

            let result
            if (profile) {
                // Update existing profile via API
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: profile.id, ...profileData }),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to update profile')
                }

                result = { data: await response.json() }
            } else {
                // Create new profile via API
                const response = await fetch('/api/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to create profile')
                }

                result = { data: await response.json() }
            }

            setSuccess(profile ? 'Profile updated successfully!' : 'Profile created successfully!')

            // Convert null values to undefined for TypeScript compatibility
            const convertedProfile: UserProfile = {
                ...result.data,
                links: result.data.links || undefined,
                education: result.data.education || undefined,
                certifications: result.data.certifications || undefined,
                languages: result.data.languages || undefined,
                location: result.data.location || undefined,
                credits: result.data.credits || 0
            }

            onProfileUpdate(convertedProfile)
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Quick Setup Card */}
            <Card className="bg-[#171717] border-[#2e2e2e]">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center border border-[#2e2e2e]">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                        </div>
                        <span className="text-[#ececec]">Quick Setup</span>
                    </CardTitle>
                    <CardDescription className="text-[#a1a1a1] text-sm sm:text-base mt-1">
                        Upload your resume PDF to auto-fill your profile fields, then customize as needed
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-4 sm:space-y-6">
                        {/* PDF Upload Section */}
                        <div>
                            <label htmlFor="resume-pdf-upload" className={`group relative flex justify-center px-4 sm:px-8 py-6 sm:py-10 border-2 border-dashed rounded-lg sm:rounded-xl transition-all duration-300 ${isUploadingResume
                                ? 'border-white bg-white/10 cursor-not-allowed'
                                : 'border-[#2e2e2e] hover:border-white cursor-pointer bg-[#212121] hover:bg-[#2e2e2e]'
                                }`}>
                                <div className="space-y-2 text-center">
                                    {isUploadingResume ? (
                                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto"></div>
                                    ) : (
                                        <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-white group-hover:text-gray-200 transition-colors" />
                                    )}
                                    <div className="flex text-base sm:text-lg font-medium text-[#ececec]">
                                        <span className={`${isUploadingResume ? 'text-gray-200' : 'text-white group-hover:text-gray-200'} transition-colors`}>
                                            {isUploadingResume ? 'Processing PDF...' : 'Upload your resume'}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#666]">PDF files only, max 10MB</p>
                                    <input
                                        id="resume-pdf-upload"
                                        name="resume-pdf-upload"
                                        type="file"
                                        accept=".pdf"
                                        className="sr-only"
                                        onChange={handleFileUpload}
                                        disabled={isUploadingResume}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Profile Form */}
            <Card className="bg-[#171717] border-[#2e2e2e]">
                <CardHeader className="border-b border-[#2e2e2e] p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="text-[#ececec]">Profile Information</span>
                    </CardTitle>
                    <CardDescription className="text-[#a1a1a1] text-sm sm:text-base mt-2">
                        Fill in your details to generate personalized cover letters that match your background
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        {/* Personal Information */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center space-x-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <User className="inline h-4 w-4 mr-1" />
                                        Full Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <Mail className="inline h-4 w-4 mr-1" />
                                        Email *
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <Phone className="inline h-4 w-4 mr-1" />
                                        Phone *
                                    </label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1a1] mb-2">
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        Location (Optional)
                                    </label>
                                    <Input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="New York, NY"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Links */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <Link className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Professional Links</h3>
                                <span className="text-xs sm:text-sm text-[#666] bg-[#212121] px-2 py-1 rounded-full">Optional</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs text-[#666] mb-1">LinkedIn</label>
                                    <Input
                                        type="text"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/johndoe"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-[#666] mb-1">GitHub</label>
                                    <Input
                                        type="text"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleChange}
                                        placeholder="https://github.com/johndoe"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-[#666] mb-1">Portfolio</label>
                                    <Input
                                        type="text"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleChange}
                                        placeholder="https://johndoe.com"
                                        className="bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center">
                                    <Code className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Skills</h3>
                                <span className="text-xs sm:text-sm text-red-400 bg-red-900/30 px-2 py-1 rounded-full">Required</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Technical and soft skills
                                </label>
                                <Textarea
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="JavaScript, React, Node.js, Python, SQL, Project Management, Team Leadership..."
                                    rows={3}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                    required
                                />
                            </div>
                        </div>

                        {/* Work Experience Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Work Experience</h3>
                                <span className="text-xs sm:text-sm text-red-400 bg-red-900/30 px-2 py-1 rounded-full">Required</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Your professional work history
                                </label>
                                <Textarea
                                    name="experiences"
                                    value={formData.experiences}
                                    onChange={handleChange}
                                    placeholder="Senior Software Engineer at Tech Corp (2020-2024)&#10;- Led development of web applications serving 100k+ users&#10;- Implemented CI/CD pipelines reducing deployment time by 50%&#10;&#10;Software Engineer at StartupXYZ (2018-2020)&#10;- Developed RESTful APIs and microservices&#10;- Collaborated with cross-functional teams"
                                    rows={5}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                    required
                                />
                            </div>
                        </div>

                        {/* Projects Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Projects</h3>
                                <span className="text-xs sm:text-sm text-[#666] bg-[#212121] px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Notable projects and achievements
                                </label>
                                <Textarea
                                    name="projects"
                                    value={formData.projects}
                                    onChange={handleChange}
                                    placeholder="E-commerce Platform (2023)&#10;- Built full-stack application using React and Node.js&#10;- Integrated payment processing and inventory management&#10;&#10;Task Management App (2022)&#10;- Developed mobile app using React Native&#10;- Implemented real-time collaboration features"
                                    rows={5}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Education</h3>
                                <span className="text-xs sm:text-sm text-[#666] bg-[#212121] px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Academic background and qualifications
                                </label>
                                <Textarea
                                    name="education"
                                    value={formData.education}
                                    onChange={handleChange}
                                    placeholder="Bachelor of Science in Computer Science&#10;University of Technology, 2018&#10;GPA: 3.8/4.0&#10;Relevant Coursework: Data Structures, Algorithms, Database Systems"
                                    rows={3}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Certifications Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <Award className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Certifications</h3>
                                <span className="text-xs sm:text-sm text-[#666] bg-[#212121] px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Professional certifications and licenses
                                </label>
                                <Textarea
                                    name="certifications"
                                    value={formData.certifications}
                                    onChange={handleChange}
                                    placeholder="AWS Certified Solutions Architect (2023)&#10;Google Cloud Professional Developer (2022)&#10;Scrum Master Certification (2021)"
                                    rows={3}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Languages Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3 border-b border-[#2e2e2e]">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-md sm:rounded-lg flex items-center justify-center border border-[#2e2e2e]">
                                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-[#ececec]">Languages</h3>
                                <span className="text-xs sm:text-sm text-[#666] bg-[#212121] px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1a1] mb-2 sm:mb-3">
                                    Languages you speak and proficiency levels
                                </label>
                                <Textarea
                                    name="languages"
                                    value={formData.languages}
                                    onChange={handleChange}
                                    placeholder="English (Native)&#10;Spanish (Conversational)&#10;French (Basic)"
                                    rows={3}
                                    className="resize-none bg-[#212121] border-[#2e2e2e] text-[#ececec] placeholder-[#666] focus:ring-2 focus:ring-white focus:border-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 px-4 sm:px-6 py-3 sm:py-4 rounded-r-lg">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                        <span className="text-white text-xs">!</span>
                                    </div>
                                    <span className="font-medium text-sm sm:text-base">{error}</span>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="bg-white/10 border-l-4 border-white text-white px-4 sm:px-6 py-3 sm:py-4 rounded-r-lg">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                        <span className="text-black text-xs">✓</span>
                                    </div>
                                    <span className="font-medium text-sm sm:text-base">{success}</span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4 sm:pt-6 border-t border-[#2e2e2e]">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="w-full sm:w-auto sm:min-w-[200px] bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                                        <span className="text-sm sm:text-base">Saving Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2 sm:mr-3" />
                                        <span className="text-sm sm:text-base">Save Profile</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}