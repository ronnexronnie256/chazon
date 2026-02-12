'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Upload, User, MapPin, Briefcase, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/auth'
import { toast } from 'react-hot-toast'

// Steps definition
const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Verification', icon: ShieldCheck },
  { id: 4, title: 'Review', icon: Check },
]

export function StewardApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      // Store current URL to redirect back after login
      // Since we are client-side, we can pass it as query param
      router.push('/auth/signin?callbackUrl=/become-steward')
      return
    }

    // Pre-fill form data if user exists
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
      }))
    }
  }, [isAuthenticated, user, router])

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    phone: '',
    address: '',
    city: '',
    profilePicture: '', // Base64 string
    // Step 2: Professional
    skills: [] as string[],
    yearsOfExperience: '',
    bio: '',
    languages: [] as string[],
    availability: '',
    // Step 3: Verification
    documentType: 'NATIONAL_ID', // 'NATIONAL_ID' or 'PASSPORT'
    nationalIdFront: '', // Base64 string
    nationalIdBack: '', // Base64 string (only for National ID)
    passportImage: '', // Base64 string (only for Passport)
    recommendationLetter: '', // Base64 string
    termsAccepted: false,
    backgroundCheckConsent: false,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error(`File size must be less than 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    // For now, we'll still use base64 for preview and send to server
    // The server will handle the Supabase upload
    const reader = new FileReader()
    reader.onloadend = () => {
      handleInputChange(field, reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
      return { ...prev, skills }
    })
  }

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => {
      const languages = prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
      return { ...prev, languages }
    })
  }

  const validateStep = (step: number) => {
    setError('')
    switch (step) {
      case 1:
        if (!formData.phone || !formData.address || !formData.city) {
          setError('Please fill in all personal details.')
          return false
        }
        if (!formData.profilePicture) {
          setError('Please upload a profile picture.')
          return false
        }
        return true
      case 2:
        if (formData.skills.length === 0) {
          setError('Please select at least one skill.')
          return false
        }
        if (!formData.bio || !formData.yearsOfExperience) {
          setError('Please complete your professional profile.')
          return false
        }
        return true
      case 3:
        if (formData.documentType === 'NATIONAL_ID') {
          if (!formData.nationalIdFront || !formData.nationalIdBack) {
            setError('Please upload both front and back of your National ID.')
            return false
          }
        } else {
          if (!formData.passportImage) {
            setError('Please upload your Passport image.')
            return false
          }
        }
        if (!formData.termsAccepted || !formData.backgroundCheckConsent) {
          setError('You must accept the terms and consent to background checks.')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrev = () => {
    setError('')
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return // Should be valid by now

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/steward-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      router.push('/become-steward/confirmation')
    } catch (err) {
      setError((err as Error).message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div className="grid gap-4">
              <div className="flex flex-col items-center mb-4">
                <Label className="mb-2">Profile Picture</Label>
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 hover:border-chazon-primary transition-colors">
                  {formData.profilePicture ? (
                    <img 
                      src={formData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <User className="h-12 w-12 mb-1" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleFileChange(e, 'profilePicture')}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+256 700 000000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City / District</Label>
                  <Input
                    id="city"
                    placeholder="Kampala"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address / Area</Label>
                  <Input
                    id="address"
                    placeholder="Ntinda, Plot 4"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Professional Profile</h2>
            
            <div className="space-y-3">
              <Label>Skills (Select all that apply)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Cleaning', 'Handyman', 'Plumbing', 'Electrical', 'Painting', 'Gardening', 'Moving', 'Tech Support', 'Tutoring', 'Cooking'].map((skill) => (
                  <div
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`cursor-pointer border rounded-md p-3 text-sm font-medium transition-colors ${
                      formData.skills.includes(skill)
                        ? 'bg-chazon-primary/10 border-chazon-primary text-chazon-primary'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-chazon-primary/50'
                    }`}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Luganda', 'Swahili'].map((lang) => (
                    <div
                      key={lang}
                      onClick={() => handleLanguageToggle(lang)}
                      className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        formData.languages.includes(lang)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Briefly describe your services and work ethic..."
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Identity Verification (KYC)</h2>
            <p className="text-sm text-gray-500">
              Please provide valid identification documents. All data is encrypted and secure.
            </p>

            <div className="space-y-4">
              <Label>Document Type</Label>
              <div className="flex space-x-4">
                <div 
                  className={`flex-1 border rounded-lg p-4 cursor-pointer flex items-center justify-center space-x-2 transition-colors ${
                    formData.documentType === 'NATIONAL_ID' 
                      ? 'bg-chazon-primary/10 border-chazon-primary text-chazon-primary' 
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                  onClick={() => handleInputChange('documentType', 'NATIONAL_ID')}
                >
                  <span className="font-medium">National ID</span>
                </div>
                <div 
                  className={`flex-1 border rounded-lg p-4 cursor-pointer flex items-center justify-center space-x-2 transition-colors ${
                    formData.documentType === 'PASSPORT' 
                      ? 'bg-chazon-primary/10 border-chazon-primary text-chazon-primary' 
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                  onClick={() => handleInputChange('documentType', 'PASSPORT')}
                >
                  <span className="font-medium">Passport</span>
                </div>
              </div>
            </div>

            {formData.documentType === 'NATIONAL_ID' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Front of ID</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors h-40 flex flex-col items-center justify-center relative">
                    {formData.nationalIdFront ? (
                      <img src={formData.nationalIdFront} alt="Front ID" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Upload Front</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'nationalIdFront')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Back of ID</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors h-40 flex flex-col items-center justify-center relative">
                    {formData.nationalIdBack ? (
                      <img src={formData.nationalIdBack} alt="Back ID" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Upload Back</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'nationalIdBack')} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Passport Photo Page</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors h-48 flex flex-col items-center justify-center relative">
                  {formData.passportImage ? (
                    <img src={formData.passportImage} alt="Passport" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Passport Page</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'passportImage')} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Recommendation Letter (Optional)</Label>
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded mr-3">
                    <ShieldCheck className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Letter</p>
                    <p className="text-xs text-gray-500">PDF or Image from previous employer/leader</p>
                  </div>
                </div>
                <div className="relative">
                  <Button variant="outline" size="sm">
                    {formData.recommendationLetter ? 'Change' : 'Upload'}
                  </Button>
                  <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'recommendationLetter')} />
                </div>
              </div>
              {formData.recommendationLetter && <p className="text-xs text-green-600 mt-1">✓ File attached</p>}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-chazon-primary focus:ring-chazon-primary"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-chazon-primary hover:underline">Terms of Service</a> and <a href="#" className="text-chazon-primary hover:underline">Privacy Policy</a>.
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.backgroundCheckConsent}
                  onChange={(e) => handleInputChange('backgroundCheckConsent', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-chazon-primary focus:ring-chazon-primary"
                />
                <label htmlFor="consent" className="text-sm text-gray-600">
                  I consent to a background check using the information provided.
                </label>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review Application</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-gray-500">Name</span>
                <span className="col-span-2 font-medium text-gray-900">Agaba (You)</span>
                
                <span className="text-gray-500">Phone</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.phone}</span>
                
                <span className="text-gray-500">Location</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.city}, {formData.address}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 border-b pb-4">
                <span className="text-gray-500">Skills</span>
                <span className="col-span-2 font-medium text-gray-900 flex flex-wrap gap-1">
                  {formData.skills.map(s => (
                    <span key={s} className="bg-white border px-2 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </span>
                
                <span className="text-gray-500">Experience</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.yearsOfExperience} Years</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <span className="text-gray-500">Verification</span>
                <span className="col-span-2 font-medium text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> ID Uploaded
                </span>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-chazon-primary -z-10 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div key={step.id} className="flex flex-col items-center bg-white px-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive || isCompleted 
                      ? 'bg-chazon-primary border-chazon-primary text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  isActive ? 'text-chazon-primary' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-xl shadow-lg min-h-[500px] flex flex-col relative overflow-hidden">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-grow"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="w-32"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          {currentStep < steps.length ? (
            <Button 
              onClick={handleNext} 
              className="w-32 bg-chazon-primary hover:bg-chazon-primary/90"
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-40 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
