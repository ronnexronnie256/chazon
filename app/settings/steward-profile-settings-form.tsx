'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type StewardProfile = {
  id: string
  userId: string
  bio: string
  skills: string[]
  experience: string
  availability: string
  serviceArea: number
  hourlyRate: number | null
  isVerified: boolean
  rating: number
  totalReviews: number
  applicationStatus: string
}

type StewardProfileSettingsFormProps = {
  stewardProfile: StewardProfile
}

export function StewardProfileSettingsForm({ stewardProfile }: StewardProfileSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      setSuccessMessage('Steward profile updated successfully')
    } catch (err) {
      setErrorMessage('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="shadow sm:rounded-md sm:overflow-hidden">
        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <div className="mt-1">
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                defaultValue={stewardProfile.bio || ''}
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Brief description of your professional background and expertise.
            </p>
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
              Skills (comma separated)
            </label>
            <div className="mt-1">
              <Input
                type="text"
                name="skills"
                id="skills"
                defaultValue={stewardProfile.skills?.join(', ') || ''}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
              Experience
            </label>
            <div className="mt-1">
              <textarea
                id="experience"
                name="experience"
                rows={3}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                defaultValue={stewardProfile.experience || ''}
                required
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
              Availability
            </label>
            <div className="mt-1">
              <select
                id="availability"
                name="availability"
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
                defaultValue={stewardProfile.availability || ''}
                required
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="weekends">Weekends only</option>
                <option value="evenings">Evenings only</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          {/* Service Area */}
          <div>
            <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
              Service Area (miles from your location)
            </label>
            <div className="mt-1">
              <select
                id="serviceArea"
                name="serviceArea"
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
                defaultValue={stewardProfile.serviceArea.toString() || ''}
                required
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="20">20 miles</option>
                <option value="25">25+ miles</option>
              </select>
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
              Hourly Rate ($)
            </label>
            <div className="mt-1">
              <Input
                type="number"
                name="hourlyRate"
                id="hourlyRate"
                min="0"
                step="0.01"
                defaultValue={stewardProfile.hourlyRate?.toString() || ''}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your default hourly rate. You can set different rates for specific services.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <Button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}
