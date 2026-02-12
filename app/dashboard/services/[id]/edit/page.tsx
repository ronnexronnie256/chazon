'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Loader2, X, Upload } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params?.id as string
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    currency: 'UGX',
    duration: '60',
    urgencyMultiplier: '1.0',
    weekendMultiplier: '1.0',
    nightMultiplier: '1.0',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/services/${serviceId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load service')
      }

      const result = await response.json()
      const service = result.data

      setFormData({
        title: service.title || '',
        category: service.category.name || '',
        description: service.description || '',
        price: service.price?.toString() || '',
        currency: service.currency || 'UGX',
        duration: service.duration?.toString() || '60',
        urgencyMultiplier: service.urgencyMultiplier?.toString() || '1.0',
        weekendMultiplier: service.weekendMultiplier?.toString() || '1.0',
        nightMultiplier: service.nightMultiplier?.toString() || '1.0',
      })
      setImages(service.images || [])
    } catch (err) {
      setError((err as Error).message)
      toast.error('Failed to load service')
      router.push('/dashboard/services')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`)
          continue
        }

        // Upload to Supabase
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('folder', 'services')
        uploadFormData.append('fileName', `service-${Date.now()}-${i}-${file.name}`)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const uploadData = await uploadResponse.json()
        newImages.push(uploadData.url)
      }

      setImages([...images, ...newImages])
      toast.success(`${newImages.length} image(s) uploaded successfully`)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to upload images')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const data = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      price: formData.price,
      currency: formData.currency,
      duration: formData.duration,
      images: images, // Include uploaded images
      urgencyMultiplier: formData.urgencyMultiplier || '1.0',
      weekendMultiplier: formData.weekendMultiplier || '1.0',
      nightMultiplier: formData.nightMultiplier || '1.0',
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update service')
      }

      toast.success('Service updated successfully!')
      router.push('/dashboard/services')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-4 text-gray-500">Loading service...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Edit Service</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Title
            </label>
            <Input 
              name="title" 
              value={formData.title}
              onChange={handleInputChange}
              required 
              placeholder="e.g. Deep Home Cleaning" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chazon-primary"
            >
              <option value="">Select a category</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Moving">Moving</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Handyman">Handyman</option>
              <option value="Gardening">Gardening</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chazon-primary"
              placeholder="Describe what you offer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <Input 
                name="price" 
                type="number" 
                value={formData.price}
                onChange={handleInputChange}
                required 
                min="0" 
                step="100" 
                placeholder="50000" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chazon-primary"
              >
                <option value="UGX">UGX (Ugandan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <Input 
              name="duration" 
              type="number" 
              value={formData.duration}
              onChange={handleInputChange}
              required 
              min="15" 
              step="15" 
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Rules (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set multipliers for special pricing conditions. Default is 1.0 (no change).
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Multiplier
                  <span className="text-xs text-gray-500 ml-2">(e.g., 1.5 = 50% increase for urgent tasks)</span>
                </label>
                <Input
                  name="urgencyMultiplier"
                  type="number"
                  value={formData.urgencyMultiplier}
                  onChange={handleInputChange}
                  min="1.0"
                  step="0.1"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekend Multiplier
                  <span className="text-xs text-gray-500 ml-2">(e.g., 1.2 = 20% increase for weekend tasks)</span>
                </label>
                <Input
                  name="weekendMultiplier"
                  type="number"
                  value={formData.weekendMultiplier}
                  onChange={handleInputChange}
                  min="1.0"
                  step="0.1"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Night Multiplier
                  <span className="text-xs text-gray-500 ml-2">(e.g., 1.3 = 30% increase for night/after-hours tasks)</span>
                </label>
                <Input
                  name="nightMultiplier"
                  type="number"
                  value={formData.nightMultiplier}
                  onChange={handleInputChange}
                  min="1.0"
                  step="0.1"
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Images
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImages ? (
                      <Loader2 className="w-8 h-8 mb-2 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    )}
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={uploadingImages}
                  />
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={imageUrl}
                          alt={`Service image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Upload up to 10 images to showcase your service
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push('/dashboard/services')}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || uploadingImages}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              {isSubmitting ? 'Updating Service...' : 'Update Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

