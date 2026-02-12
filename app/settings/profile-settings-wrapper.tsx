'use client'

import { ProfileSettingsForm } from './profile-settings-form'

type ProfileSettingsWrapperProps = {
  user: any
}

export function ProfileSettingsWrapper({ user }: ProfileSettingsWrapperProps) {
  // Create a compatible user object with the expected properties
  const compatibleUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    phone: user.phone,
    address: user.location // Use location as address
  }

  return <ProfileSettingsForm user={compatibleUser} />
}