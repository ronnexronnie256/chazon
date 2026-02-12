/**
 * Supabase Storage utilities
 * Handles file uploads to Supabase Storage buckets
 */
import { createClient } from './client'

const BUCKET_NAME = 'chazon'

export interface UploadOptions {
  folder?: string
  fileName?: string
  contentType?: string
  cacheControl?: string
}

/**
 * Upload a file to Supabase Storage
 * @param file - File object or base64 string
 * @param path - Path within the bucket (e.g., 'profiles/user-123.jpg')
 * @param options - Upload options
 * @returns Public URL of the uploaded file
 */
export async function uploadToSupabase(
  file: File | string,
  path: string,
  options: UploadOptions = {}
): Promise<string> {
  try {
    const supabase = createClient()
    
    // Convert base64 to File if needed
    let fileToUpload: File
    if (typeof file === 'string') {
      // Base64 string
      const base64Data = file.split(',')[1] || file
      const mimeMatch = file.match(/data:([^;]+);base64/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      
      const fileName = options.fileName || `file-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`
      fileToUpload = new File([blob], fileName, { type: mimeType })
    } else {
      fileToUpload = file
    }

    // Construct full path
    const folder = options.folder ? `${options.folder}/` : ''
    const fileName = options.fileName || fileToUpload.name || `file-${Date.now()}`
    const fullPath = `${folder}${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, fileToUpload, {
        contentType: options.contentType || fileToUpload.type,
        cacheControl: options.cacheControl || '3600',
        upsert: false, // Don't overwrite existing files
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
 * Delete a file from Supabase Storage
 * @param path - Path to the file in the bucket
 */
export async function deleteFromSupabase(path: string): Promise<void> {
  try {
    const supabase = createClient()
    
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
 * Get public URL for a file in Supabase Storage
 * @param path - Path to the file in the bucket
 * @returns Public URL
 */
export function getSupabasePublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  
  return data.publicUrl
}

