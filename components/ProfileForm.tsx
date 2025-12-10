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

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file.')
            return
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size must be less than 10MB.')
            return
        }

        setIsUploadingResume(true)
        setError('')
        setSuccess('Processing PDF, please wait...')

        try {
            console.log('Starting PDF processing...')

            // Create FormData to send the file to API
            const formData = new FormData()
            formData.append('file', file)

            setSuccess('Extracting text from PDF...')

            // Send to API endpoint for processing
            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                body: formData
            })

            setSuccess('Processing with AI...')

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to process PDF')
            }

            const responseData = await response.json()
            console.log('API Response:', responseData)

            const extractedData = responseData.data
            console.log('Extracted data:', extractedData)

            // Format arrays for display
            const { formatSkillsArray, formatLanguagesArray } = await import('@/lib/resume-parser')

            // Update form data with extracted information
            setFormData(prev => {
                const newFormData = {
                    ...prev,
                    full_name: extractedData.full_name || prev.full_name,
                    email: extractedData.email || prev.email,
                    phone: extractedData.phone || prev.phone,
                    location: extractedData.location || prev.location,
                    linkedin: extractedData.linkedin || prev.linkedin,
                    github: extractedData.github || prev.github,
                    portfolio: extractedData.portfolio || prev.portfolio,
                    experiences: extractedData.experiences || prev.experiences,
                    projects: extractedData.projects || prev.projects,
                    skills: formatSkillsArray(extractedData.skills || null) || prev.skills,
                    education: extractedData.education || prev.education,
                    certifications: extractedData.certifications || prev.certifications,
                    languages: formatLanguagesArray(extractedData.languages || null) || prev.languages,
                }
                console.log('New form data:', newFormData)
                return newFormData
            })

            setSuccess('PDF processed successfully! Review and edit the extracted information before saving.')

            // Clear the file input
            event.target.value = ''
        } catch (error: any) {
            console.error('PDF processing error:', error)
            setError(error.message || 'Failed to process PDF. Please try again or fill in the information manually.')
        } finally {
            setIsUploadingResume(false)
        }
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        // Validate required fields
        if (!formData.full_name || !formData.email || !formData.phone || !formData.experiences || !formData.skills) {
            setError('Please fill in all required fields (Name, Email, Phone, Experiences, Skills)')
            setIsLoading(false)
            return
        }

        try {
            // Concatenate links
            const linksArray = []
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
        <div className="space-y-6">
            {/* Resume Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-green-600" />
                        <span>Quick Setup</span>
                    </CardTitle>
                    <CardDescription>
                        Upload your resume and click save
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* PDF Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Resume PDF
                            </label>
                            <label htmlFor="resume-pdf-upload" className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all duration-300 ${isUploadingResume
                                ? 'border-green-400 bg-green-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-gray-400 cursor-pointer bg-gray-100'
                                }`}>
                                <div className="space-y-1 text-center">
                                    {isUploadingResume ? (
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                                    ) : (
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600">
                                        <span className={`font-medium ${isUploadingResume
                                            ? 'text-green-700'
                                            : 'text-green-600'
                                            }`}>
                                            {isUploadingResume ? 'Processing PDF...' : 'Upload your resume'}
                                        </span>
                                        <input
                                            id="resume-pdf-upload"
                                            name="resume-pdf-upload"
                                            type="file"
                                            accept=".pdf"
                                            className="sr-only"
                                            onChange={handleFileUpload}
                                            disabled={isUploadingResume}
                                        />
                                        {!isUploadingResume && <span className="pl-1">or drag and drop</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {isUploadingResume ? 'Please wait while we process your resume...' : 'PDF up to 10MB'}
                                    </p>
                                </div>
                            </label>
                        </div>


                    </div>
                </CardContent>
            </Card>

            {/* Manual Profile Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-green-600" />
                        <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>
                        Fill out your details manually to create personalized cover letters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
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
                                    placeholder="john.doe@example.com"
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
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="inline h-4 w-4 mr-1" />
                                    Location
                                </label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="New York, NY"
                                />
                            </div>
                        </div>

                        {/* Professional Links */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Link className="inline h-4 w-4 mr-1" />
                                Professional Links (Optional)
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">LinkedIn (Optional)</label>
                                    <Input
                                        type="text"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/johndoe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">GitHub (Optional)</label>
                                    <Input
                                        type="text"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleChange}
                                        placeholder="https://github.com/johndoe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Portfolio (Optional)</label>
                                    <Input
                                        type="text"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleChange}
                                        placeholder="https://johndoe.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Code className="inline h-4 w-4 mr-1" />
                                Skills *
                            </label>
                            <Textarea
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="JavaScript, React, Node.js, Python, SQL, Project Management, Team Leadership..."
                                rows={4}
                                className="resize-none"
                                required
                            />
                        </div>

                        {/* Experiences */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Briefcase className="inline h-4 w-4 mr-1" />
                                Work Experience *
                            </label>
                            <Textarea
                                name="experiences"
                                value={formData.experiences}
                                onChange={handleChange}
                                placeholder="Senior Software Engineer at Tech Corp (2020-2024)&#10;- Led development of web applications serving 100k+ users&#10;- Implemented CI/CD pipelines reducing deployment time by 50%&#10;&#10;Software Engineer at StartupXYZ (2018-2020)&#10;- Developed RESTful APIs and microservices&#10;- Collaborated with cross-functional teams"
                                rows={6}
                                className="resize-none"
                                required
                            />
                        </div>

                        {/* Projects */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="inline h-4 w-4 mr-1" />
                                Projects
                            </label>
                            <Textarea
                                name="projects"
                                value={formData.projects}
                                onChange={handleChange}
                                placeholder="E-commerce Platform (2023)&#10;- Built full-stack application using React and Node.js&#10;- Integrated payment processing and inventory management&#10;&#10;Task Management App (2022)&#10;- Developed mobile app using React Native&#10;- Implemented real-time collaboration features"
                                rows={6}
                                className="resize-none"
                            />
                        </div>

                        {/* Education */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <GraduationCap className="inline h-4 w-4 mr-1" />
                                Education (Optional)
                            </label>
                            <Textarea
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                placeholder="Bachelor of Science in Computer Science&#10;University of Technology, 2018&#10;GPA: 3.8/4.0&#10;Relevant Coursework: Data Structures, Algorithms, Database Systems"
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* Certifications */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Award className="inline h-4 w-4 mr-1" />
                                Certifications (Optional)
                            </label>
                            <Textarea
                                name="certifications"
                                value={formData.certifications}
                                onChange={handleChange}
                                placeholder="AWS Certified Solutions Architect (2023)&#10;Google Cloud Professional Developer (2022)&#10;Scrum Master Certification (2021)"
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Languages */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Globe className="inline h-4 w-4 mr-1" />
                                Languages
                            </label>
                            <Textarea
                                name="languages"
                                value={formData.languages}
                                onChange={handleChange}
                                placeholder="English (Native)&#10;Spanish (Conversational)&#10;French (Basic)"
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Error and Success Messages */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                                {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="min-w-[150px]"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
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