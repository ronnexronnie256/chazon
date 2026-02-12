/**
 * Server-side Supabase Storage utilities
 * Use this in Server Components, Server Actions, and Route Handlers
 */
import { createClient } from './server'

const BUCKET_NAME = 'chazon'

export interface UploadOptions {
  folder?: string
  fileName?: string
  contentType?: string
  cacheControl?: string
}

/**
 * Upload a file to Supabase Storage (server-side)
 * @param file - File buffer or base64 string
 * @param path - Path within the bucket (e.g., 'profiles/user-123.jpg')
 * @param options - Upload options
 * @returns Public URL of the uploaded file
 */
export async function uploadToSupabaseServer(
  file: Buffer | string,
  path: string,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Convert base64 to Buffer if needed
    let fileBuffer: Buffer
    if (typeof file === 'string') {
      // Base64 string
      const base64Data = file.includes(',') ? file.split(',')[1] : file
      fileBuffer = Buffer.from(base64Data, 'base64')
    } else {
      fileBuffer = file
    }

    // Use the provided path directly (it should already include folder structure)
    const fullPath = path

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, fileBuffer, {
        contentType: options.contentType || 'image/jpeg',
        cacheControl: options.cacheControl || '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file')
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload to Supabase error:', error)
    throw error
  }
}

/**
 * Delete a file from Supabase Storage (server-side)
 * @param path - Path to the file in the bucket
 */
export async function deleteFromSupabaseServer(path: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('Supabase delete error:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  } catch (error) {
    console.error('Delete from Supabase error:', error)
    throw error
  }
}

/**
 * Get public URL for a file in Supabase Storage (server-side)
 * @param path - Path to the file in the bucket
 * @returns Public URL
 */
export async function getSupabasePublicUrlServer(path: string): Promise<string> {
  const supabase = await createClient()
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  
  return data.publicUrl
}

