"use client"

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, XCircle, Clock, Eye, User, Mail, Phone, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface StewardApplication {
  id: string
  backgroundCheckStatus: 'PENDING' | 'CLEARED' | 'REJECTED'
  bio: string | null
  skills: string[]
  languages: string[]
  yearsOfExperience: number
  verificationDocumentType: string | null
  verificationDocumentFront: string | null
  verificationDocumentBack: string | null
  recommendationLetter: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    image: string | null
    role: string
    createdAt: string
  }
}

export default function AdminStewardsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [applications, setApplications] = useState<StewardApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CLEARED' | 'REJECTED'>('PENDING')
  const [selectedApp, setSelectedApp] = useState<StewardApplication | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard')
      return
    }

    fetchApplications()
  }, [isAuthenticated, filter, router, user])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const status = filter === 'ALL' ? '' : filter
      const url = `/api/admin/stewards${status ? `?status=${status}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications')
      }

      setApplications(data.data || [])
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      toast.error(error.message || 'Failed to load steward applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this steward application?')) {
      return
    }

    setIsProcessing(applicationId)
    try {
      const response = await fetch(`/api/admin/stewards/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application')
      }

      toast.success('Steward application approved successfully')
      fetchApplications()
      setSelectedApp(null)
    } catch (error: any) {
      console.error('Error approving application:', error)
      toast.error(error.message || 'Failed to approve application')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    
    if (reason === null) return // User cancelled

    setIsProcessing(applicationId)
    try {
      const response = await fetch(`/api/admin/stewards/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application')
      }

      toast.success('Steward application rejected')
      fetchApplications()
      setSelectedApp(null)
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      toast.error(error.message || 'Failed to reject application')
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLEARED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Steward Applications</h1>
            <p className="text-gray-600">Review and manage steward applications</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            {(['ALL', 'PENDING', 'CLEARED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-chazon-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No applications found</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {app.user.image ? (
                          <ImageWithFallback
                            src={app.user.image}
                            alt={app.user.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{app.user.name}</h3>
                          {getStatusBadge(app.backgroundCheckStatus)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{app.user.email}</span>
                          </div>
                          {app.user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{app.user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Skills:</span>
                            <span>{app.skills.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Experience:</span>
                            <span>{app.yearsOfExperience} years</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {app.backgroundCheckStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(app.id)}
                            disabled={isProcessing === app.id}
                            title="Requires Google verification"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(app.id)}
                            disabled={isProcessing === app.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedApp.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedApp.user.email}</p>
                  </div>
                  {selectedApp.user.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedApp.user.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {getStatusBadge(selectedApp.backgroundCheckStatus)}
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="font-medium">{selectedApp.bio || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApp.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-gray-100 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Languages</p>
                    <p className="font-medium">{selectedApp.languages.join(', ') || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Years of Experience</p>
                    <p className="font-medium">{selectedApp.yearsOfExperience} years</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Document Type</p>
                    <p className="font-medium">{selectedApp.verificationDocumentType || 'Not provided'}</p>
                  </div>
                  {selectedApp.verificationDocumentFront && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Front Document</p>
                      <a
                        href={selectedApp.verificationDocumentFront}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-chazon-primary hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                  {selectedApp.verificationDocumentBack && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Back Document</p>
                      <a
                        href={selectedApp.verificationDocumentBack}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-chazon-primary hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                  {selectedApp.recommendationLetter && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Recommendation Letter</p>
                      <a
                        href={selectedApp.recommendationLetter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-chazon-primary hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedApp.backgroundCheckStatus === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedApp.id)
                    }}
                    disabled={isProcessing === selectedApp.id}
                      title="Requires Google verification"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      handleReject(selectedApp.id)
                    }}
                    disabled={isProcessing === selectedApp.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
