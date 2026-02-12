'use client'

import { AccountSettingsForm } from './account-settings-form'

type AccountSettingsWrapperProps = {
  user: any
}

export function AccountSettingsWrapper({ user }: AccountSettingsWrapperProps) {
  // Create a compatible user object with the expected properties
  const compatibleUser = {
    emailNotifications: user.emailNotifications || false,
    marketingEmails: user.marketingEmails || false
  }

  return <AccountSettingsForm user={compatibleUser} />
}