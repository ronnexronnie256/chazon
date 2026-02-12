"use client"

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { redirect } from 'next/navigation'
import { ProfileSettingsForm } from './profile-settings-form'
import { ProfileSettingsWrapper } from './profile-settings-wrapper'
import { StewardProfileSettingsForm } from './steward-profile-settings-form'
import { StewardProfileWrapper } from './steward-profile-wrapper'
import { AccountSettingsForm } from './account-settings-form'
import { AccountSettingsWrapper } from './account-settings-wrapper'
import { DeleteAccountButton } from './delete-account-button'
import { ChangePasswordForm } from './change-password-form'
import { useAuthStore } from '@/store/auth'

export default function SettingsPage() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated || !user) {
    redirect('/auth/signin')
  }
  const isSteward = !!user.isSteward

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h2 className="text-lg font-medium leading-6 text-gray-900">Profile Settings</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Update your personal information and how others see you on the platform.
                </p>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <ProfileSettingsWrapper user={user as any} />
            </div>
          </div>

          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>

          {/* Steward Profile Settings (if applicable) */}
          {isSteward && (
            <div className="mt-10 sm:mt-0 pt-5">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <div className="px-4 sm:px-0">
                    <h2 className="text-lg font-medium leading-6 text-gray-900">Steward Profile</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Update your professional information that clients will see.
                    </p>
                  </div>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <StewardProfileWrapper stewardProfile={undefined as any} />
                </div>
              </div>
            </div>
          )}

          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>

          {/* Account Settings */}
          <div className="mt-10 sm:mt-0 pt-5">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Account Settings</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your account preferences and security settings.
                  </p>
                </div>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <AccountSettingsWrapper user={user as any} />
                
                <div className="mt-6 shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div className="space-y-4">
                      <div className="pt-4">
                        <h3 className="text-md font-medium text-gray-900">Password</h3>
                        <div className="mt-4">
                          <ChangePasswordForm />
                        </div>
                      </div>

                      <div className="pt-4">
                        <h3 className="text-md font-medium text-gray-900">Delete Account</h3>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <DeleteAccountButton />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
