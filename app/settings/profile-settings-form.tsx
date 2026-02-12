'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

type User = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  phone: string | null
  address: string | null
}

type ProfileSettingsFormProps = {
  user: User
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const { updateUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const phone = formData.get('phone') as string
      const address = formData.get('address') as string
      updateUser({ name, phone, location: address })
      setSuccessMessage('Profile updated successfully')
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

          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            <div className="mt-2 flex items-center space-x-5">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback>
                  {user.name?.charAt(0) || <User className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline">
                Change
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              JPG, PNG or GIF. 1MB max.
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1">
              <Input
                type="text"
                name="name"
                id="name"
                defaultValue={user.name || ''}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <Input
                type="email"
                name="email"
                id="email"
                defaultValue={user.email || ''}
                disabled
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Email cannot be changed. This is your login identifier.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <div className="mt-1">
              <Input
                type="tel"
                name="phone"
                id="phone"
                defaultValue={user.phone || ''}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <div className="mt-1">
              <Input
                type="text"
                name="address"
                id="address"
                defaultValue={user.address || ''}
                className="shadow-sm focus:ring-chazon-primary focus:border-chazon-primary block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
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
