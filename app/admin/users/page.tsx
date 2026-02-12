"use client"

import { useEffect, useState, Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { 
  Users, 
  UserCheck, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Shield,
  ShieldCheck,
  UserX,
  Download,
  Lock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  image: string | null
  isIdentityVerified: boolean
  createdAt: string
  stewardProfile?: {
    id: string
    backgroundCheckStatus: string
    rating: number
    completedTasks: number
  } | null
  taskCounts: {
    asClient: number
    asSteward: number
  }
}

function AdminUsersPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || 'ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [isAuthenticated, roleFilter, page, router, user])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'ALL') {
        params.append('role', roleFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', page.toString())
      
      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.data || [])
      setTotalPages(data.meta?.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleRoleChange = (role: string) => {
    setRoleFilter(role)
    setPage(1)
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    setIsProcessing(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { role: newRole }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      toast.success('User role updated successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setIsProcessing(userId)
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    } finally {
      setIsProcessing(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        )
      case 'STEWARD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Steward
          </span>
        )
      case 'CLIENT':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            Client
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage all users and stewards on the platform</p>
            </div>
            <button
              onClick={() => {
                const url = `/api/admin/export?type=users`
                const a = document.createElement('a')
                a.href = url
                a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                toast.success('Export started')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                {(['ALL', 'CLIENT', 'STEWARD', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roleFilter === role
                        ? 'bg-chazon-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tasks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {u.image ? (
                                  <ImageWithFallback
                                    src={u.image}
                                    alt={u.name}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    {u.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {u.email}
                                </div>
                                {u.phone && (
                                  <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {u.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRoleBadge(u.role)}
                            {u.stewardProfile && (
                              <div className="text-xs text-gray-500 mt-1">
                                Rating: {u.stewardProfile.rating.toFixed(1)} ⭐
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>Client: {u.taskCounts.asClient}</div>
                            <div>Steward: {u.taskCounts.asSteward}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.isIdentityVerified ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <UserX className="h-3 w-3 mr-1" />
                                Unverified
                              </span>
                            )}
                            {u.stewardProfile && (
                              <div className="text-xs text-gray-500 mt-1">
                                {u.stewardProfile.backgroundCheckStatus}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isProcessing === u.id || u.id === user?.id}
                                    title="Requires Google verification"
                                  >
                                    <Lock className="h-4 w-4 mr-1" />
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(u.id, 'CLIENT')}
                                    disabled={u.role === 'CLIENT' || isProcessing === u.id}
                                  >
                                    Set as Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(u.id, 'STEWARD')}
                                    disabled={u.role === 'STEWARD' || isProcessing === u.id}
                                  >
                                    Set as Steward
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateRole(u.id, 'ADMIN')}
                                    disabled={u.role === 'ADMIN' || isProcessing === u.id}
                                  >
                                    Set as Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={isProcessing === u.id || u.id === user?.id}
                                title="Requires Google verification"
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <AdminUsersPageContent />
    </Suspense>
  )
}
