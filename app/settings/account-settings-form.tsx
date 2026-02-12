'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type AccountSettingsFormProps = {
  user: {
    emailNotifications?: boolean
    marketingEmails?: boolean
  }
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      setSuccessMessage('Account settings updated successfully')
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

          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-gray-900">Email Notifications</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="booking-notifications"
                      name="booking-notifications"
                      type="checkbox"
                      defaultChecked={user.emailNotifications !== false}
                      className="focus:ring-chazon-primary h-4 w-4 text-chazon-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="booking-notifications" className="font-medium text-gray-700">
                      Booking notifications
                    </label>
                    <p className="text-gray-500">Receive emails when you get new bookings or booking updates.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="marketing-emails"
                      name="marketing-emails"
                      type="checkbox"
                      defaultChecked={user.marketingEmails !== false}
                      className="focus:ring-chazon-primary h-4 w-4 text-chazon-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="marketing-emails" className="font-medium text-gray-700">
                      Marketing emails
                    </label>
                    <p className="text-gray-500">Receive emails about new features and special offers.</p>
                  </div>
                </div>
              </div>
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
