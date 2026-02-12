import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { prisma } from '@/lib/prisma'
import { uploadToSupabaseServer } from '@/lib/supabase/storage-server'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getUser()
    
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.json()
    const { 
      skills, 
      experience, 
      availability, 
      bio,
      phone,
      address,
      city,
      languages,
      yearsOfExperience,
      profilePicture,
      documentType,
      nationalIdFront,
      nationalIdBack,
      passportImage,
      recommendationLetter
    } = formData

    // Basic validation
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'At least one skill is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if profile already exists
    const existingProfile = await prisma.stewardProfile.findUnique({
      where: { userId: user.id },
    })

    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already exists',
        redirect: '/dashboard' 
      })
    }

    // Upload Helper
    const uploadImage = async (
      file: string | null | undefined, 
      folder: string, 
      fileName?: string
    ) => {
      if (file && file.startsWith('data:')) {
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 9)
        const defaultFileName = fileName || `file-${timestamp}-${randomStr}.jpg`
        const fullPath = `${folder}/${defaultFileName}`
        return await uploadToSupabaseServer(file, fullPath, {
          folder,
          fileName: defaultFileName,
        })
      }
      return null
    }

    // Upload Files
    let profilePicUrl = null
    let frontDocUrl = null
    let backDocUrl = null
    let recLetterUrl = null

    try {
      // Profile Picture
      profilePicUrl = await uploadImage(
        profilePicture, 
        'profiles',
        `profile-${user.id}-${Date.now()}.jpg`
      )
      
      // Recommendation Letter
      recLetterUrl = await uploadImage(
        recommendationLetter, 
        'docs',
        `recommendation-${user.id}-${Date.now()}.pdf`
      )

      // KYC Documents
      if (documentType === 'NATIONAL_ID') {
        frontDocUrl = await uploadImage(
          nationalIdFront, 
          'kyc',
          `national-id-front-${user.id}-${Date.now()}.jpg`
        )
        backDocUrl = await uploadImage(
          nationalIdBack, 
          'kyc',
          `national-id-back-${user.id}-${Date.now()}.jpg`
        )
      } else if (documentType === 'PASSPORT') {
        frontDocUrl = await uploadImage(
          passportImage, 
          'kyc',
          `passport-${user.id}-${Date.now()}.jpg`
        )
      }
    } catch (uploadError) {
      console.error('Upload failed:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload files. Please try again.',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Create Steward Profile (DO NOT update role to STEWARD yet - wait for admin approval)
    // User role remains CLIENT until admin approves
    await prisma.$transaction([
      prisma.stewardProfile.create({
        data: {
          userId: user.id,
          bio: bio || experience,
          skills: skills,
          languages: languages || [],
          yearsOfExperience: parseInt(yearsOfExperience) || 0,
          
          // KYC Data
          verificationDocumentType: documentType,
          verificationDocumentFront: frontDocUrl,
          verificationDocumentBack: backDocUrl,
          recommendationLetter: recLetterUrl,
          backgroundCheckStatus: 'PENDING', // Awaiting admin approval
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          // Keep role as CLIENT until admin approval
          // role: 'STEWARD', // Will be set when admin approves
          phone: phone,
          address: address,
          city: city,
          image: profilePicUrl || user.image, // Update profile pic if provided
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      redirect: '/become-steward/confirmation',
    })
  } catch (error) {
    console.error('Steward application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
