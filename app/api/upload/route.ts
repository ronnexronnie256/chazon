/**
 * API route for file uploads to Supabase Storage
 * Handles file uploads from client-side
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/clerk/auth'
import { uploadToSupabaseServer } from '@/lib/supabase/storage-server'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    const fileName = formData.get('fileName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename if not provided
    const uniqueFileName = fileName || `${Date.now()}-${file.name}`

    // Upload to Supabase Storage
    const publicUrl = await uploadToSupabaseServer(
      buffer,
      `${folder}/${uniqueFileName}`,
      {
        folder,
        fileName: uniqueFileName,
        contentType: file.type,
      }
    )

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: `${folder}/${uniqueFileName}`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
