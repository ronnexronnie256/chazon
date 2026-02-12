'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export function DeleteAccountButton() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const openConfirmation = () => {
    setIsOpen(true)
    setError('')
  }

  const closeConfirmation = () => {
    setIsOpen(false)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await logout()
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={openConfirmation}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Delete account
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            
            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={closeConfirmation}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
