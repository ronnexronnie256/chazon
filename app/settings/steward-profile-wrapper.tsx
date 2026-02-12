'use client'

import { StewardProfileSettingsForm } from './steward-profile-settings-form'

type StewardProfileWrapperProps = {
  stewardProfile: any
}

export function StewardProfileWrapper({ stewardProfile }: StewardProfileWrapperProps) {
  if (!stewardProfile) return <div>No steward profile found</div>
  
  // Create a compatible stewardProfile object with the expected properties
  const compatibleProfile = {
    id: stewardProfile.id,
    userId: stewardProfile.userId,
    bio: stewardProfile.bio || '',
    skills: stewardProfile.skills || [],
    experience: stewardProfile.experience || '',
    availability: JSON.stringify(stewardProfile.availability) || '',
    serviceArea: 10, // Default value
    hourlyRate: stewardProfile.hourlyRate || null,
    isVerified: false,
    rating: 0,
    totalReviews: 0,
    applicationStatus: 'PENDING'
  }

  return <StewardProfileSettingsForm stewardProfile={compatibleProfile} />
}