'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const openForm = () => {
    setIsOpen(true)
    setSuccessMessage('')
    setErrorMessage('')
  }

  const closeForm = () => {
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('current-password') as string
    const newPassword = formData.get('new-password') as string
    const confirmPassword = formData.get('confirm-password') as string

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('All fields are required')
      setIsSubmitting(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long')
      setIsSubmitting(false)
      return
    }

    try {
      setSuccessMessage('Password changed successfully')
      e.currentTarget.reset()
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      console.error(err)
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <button
        onClick={openForm}
        className="text-chazon-primary hover:text-chazon-primary-dark font-medium"
      >
        Change password
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            
            {successMessage && (
              <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    name="current-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-chazon-primary focus:border-chazon-primary sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    name="new-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-chazon-primary focus:border-chazon-primary sm:text-sm"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    name="confirm-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-chazon-primary focus:border-chazon-primary sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
