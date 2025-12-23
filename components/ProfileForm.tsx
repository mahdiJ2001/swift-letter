'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
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

            const data = await response.json()

            if (data.success && data.profile) {
                const extractedProfile = data.profile

                // Update form data with extracted information
                setFormData(prev => ({
                    ...prev,
                    full_name: extractedProfile.full_name || prev.full_name,
                    email: extractedProfile.email || prev.email,
                    phone: extractedProfile.phone || prev.phone,
                    location: extractedProfile.location || prev.location,
                    experiences: extractedProfile.experiences || prev.experiences,
                    projects: extractedProfile.projects || prev.projects,
                    skills: extractedProfile.skills || prev.skills,
                    education: extractedProfile.education || prev.education,
                    certifications: extractedProfile.certifications || prev.certifications,
                    languages: extractedProfile.languages || prev.languages,
                }))

                setSuccess('Resume processed successfully! Review and customize the extracted information.')
            } else {
                throw new Error(data.error || 'Failed to extract information from PDF')
            }
        } catch (error: any) {
            console.error('Error uploading resume:', error)
            setError(error.message || 'Failed to process resume. Please try again.')
        } finally {
            setIsUploadingResume(false)
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
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-900">Quick Setup</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                        Upload your resume PDF to auto-fill your profile fields, then customize as needed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* PDF Upload Section */}
                        <div>
                            <label htmlFor="resume-pdf-upload" className={`group relative flex justify-center px-8 py-10 border-2 border-dashed rounded-xl transition-all duration-300 ${isUploadingResume
                                    ? 'border-green-400 bg-green-50/50 cursor-not-allowed'
                                    : 'border-green-300 hover:border-green-400 cursor-pointer bg-white hover:bg-green-50/30'
                                }`}>
                                <div className="space-y-2 text-center">
                                    {isUploadingResume ? (
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                    ) : (
                                        <Upload className="mx-auto h-12 w-12 text-green-500 group-hover:text-green-600 transition-colors" />
                                    )}
                                    <div className="flex text-lg font-medium text-gray-700">
                                        <span className={`${isUploadingResume ? 'text-green-700' : 'text-green-600 group-hover:text-green-700'} transition-colors`}>
                                            {isUploadingResume ? 'Processing PDF...' : 'Upload your resume'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
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
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b border-gray-200">
                    <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-900">Profile Information</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base mt-2">
                        Fill in your details to generate personalized cover letters that match your background
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="inline h-4 w-4 mr-1" />
                                        Full Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="inline h-4 w-4 mr-1" />
                                        Email *
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="inline h-4 w-4 mr-1" />
                                        Phone *
                                    </label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        Location (Optional)
                                    </label>
                                    <Input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="New York, NY"
                                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Links */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Link className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Professional Links</h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                                    <Input
                                        type="text"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/johndoe"
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">GitHub</label>
                                    <Input
                                        type="text"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleChange}
                                        placeholder="https://github.com/johndoe"
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Portfolio</label>
                                    <Input
                                        type="text"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleChange}
                                        placeholder="https://johndoe.com"
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <Code className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                                <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded-full">Required</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Technical and soft skills
                                </label>
                                <Textarea
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="JavaScript, React, Node.js, Python, SQL, Project Management, Team Leadership..."
                                    rows={4}
                                    className="resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Work Experience Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <Briefcase className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                                <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded-full">Required</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Your professional work history
                                </label>
                                <Textarea
                                    name="experiences"
                                    value={formData.experiences}
                                    onChange={handleChange}
                                    placeholder="Senior Software Engineer at Tech Corp (2020-2024)&#10;- Led development of web applications serving 100k+ users&#10;- Implemented CI/CD pipelines reducing deployment time by 50%&#10;&#10;Software Engineer at StartupXYZ (2018-2020)&#10;- Developed RESTful APIs and microservices&#10;- Collaborated with cross-functional teams"
                                    rows={6}
                                    className="resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Projects Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Notable projects and achievements
                                </label>
                                <Textarea
                                    name="projects"
                                    value={formData.projects}
                                    onChange={handleChange}
                                    placeholder="E-commerce Platform (2023)&#10;- Built full-stack application using React and Node.js&#10;- Integrated payment processing and inventory management&#10;&#10;Task Management App (2022)&#10;- Developed mobile app using React Native&#10;- Implemented real-time collaboration features"
                                    rows={6}
                                    className="resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Academic background and qualifications
                                </label>
                                <Textarea
                                    name="education"
                                    value={formData.education}
                                    onChange={handleChange}
                                    placeholder="Bachelor of Science in Computer Science&#10;University of Technology, 2018&#10;GPA: 3.8/4.0&#10;Relevant Coursework: Data Structures, Algorithms, Database Systems"
                                    rows={4}
                                    className="resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                />
                            </div>
                        </div>

                        {/* Certifications Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                    <Award className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Professional certifications and licenses
                                </label>
                                <Textarea
                                    name="certifications"
                                    value={formData.certifications}
                                    onChange={handleChange}
                                    placeholder="AWS Certified Solutions Architect (2023)&#10;Google Cloud Professional Developer (2022)&#10;Scrum Master Certification (2021)"
                                    rows={3}
                                    className="resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                />
                            </div>
                        </div>

                        {/* Languages Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 pb-3 border-b-2 border-gray-100">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                                    <Globe className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Languages you speak and proficiency levels
                                </label>
                                <Textarea
                                    name="languages"
                                    value={formData.languages}
                                    onChange={handleChange}
                                    placeholder="English (Native)&#10;Spanish (Conversational)&#10;French (Basic)"
                                    rows={3}
                                    className="resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white text-xs">!</span>
                                    </div>
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                    <span className="font-medium">{success}</span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center pt-6 border-t border-gray-200">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="min-w-[200px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Saving Profile...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-3" />
                                        Save Profile
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