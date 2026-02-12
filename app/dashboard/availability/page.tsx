"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Calendar, Clock, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { redirect } from 'next/navigation'
import toast from 'react-hot-toast'

interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  specificDate: string | null
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function AvailabilityPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true,
    specificDate: '',
  })

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect('/auth/signin')
    }

    if (user.role !== 'STEWARD') {
      redirect('/dashboard')
    }

    fetchAvailability()
  }, [isAuthenticated, user])

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability')
      const data = await response.json()
      if (data.success) {
        setSlots(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          specificDate: formData.specificDate || null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Availability slot added successfully')
        setShowAddForm(false)
        setFormData({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isRecurring: true,
          specificDate: '',
        })
        fetchAvailability()
      } else {
        toast.error(data.error || 'Failed to add availability slot')
      }
    } catch (error) {
      console.error('Error adding availability:', error)
      toast.error('Failed to add availability slot')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<AvailabilitySlot>) => {
    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Availability slot updated successfully')
        setEditingId(null)
        fetchAvailability()
      } else {
        toast.error(data.error || 'Failed to update availability slot')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability slot')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Availability slot deleted successfully')
        fetchAvailability()
      } else {
        toast.error(data.error || 'Failed to delete availability slot')
      }
    } catch (error) {
      console.error('Error deleting availability:', error)
      toast.error('Failed to delete availability slot')
    }
  }

  const getSlotsByDay = (dayOfWeek: number) => {
    return slots.filter((slot) => slot.dayOfWeek === dayOfWeek)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Loading...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Manage Availability
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Set your weekly availability schedule. Clients will only see tasks that match your available times.
            </p>
          </div>

          {/* Add New Slot Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chazon-primary hover:bg-chazon-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chazon-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Availability Slot
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Availability Slot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                  >
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring
                  </label>
                  <select
                    value={formData.isRecurring ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                  >
                    <option value="true">Weekly (Recurring)</option>
                    <option value="false">Specific Date</option>
                  </select>
                </div>

                {!formData.isRecurring && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specific Date
                    </label>
                    <input
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                      required={!formData.isRecurring}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-chazon-primary"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Slot
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      dayOfWeek: 1,
                      startTime: '09:00',
                      endTime: '17:00',
                      isRecurring: true,
                      specificDate: '',
                    })
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Weekly Calendar View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const daySlots = getSlotsByDay(dayIndex)
                return (
                  <div key={dayIndex} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{day}</h3>
                      {daySlots.length === 0 && (
                        <span className="text-sm text-gray-500">No availability set</span>
                      )}
                    </div>

                    {daySlots.length > 0 && (
                      <div className="space-y-3">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            {editingId === slot.id ? (
                              <EditSlotForm
                                slot={slot}
                                onSave={(updates) => handleUpdate(slot.id, updates)}
                                onCancel={() => setEditingId(null)}
                              />
                            ) : (
                              <>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {slot.isRecurring
                                      ? 'Weekly'
                                      : slot.specificDate
                                      ? new Date(slot.specificDate).toLocaleDateString()
                                      : 'One-time'}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingId(slot.id)}
                                    className="p-2 text-gray-400 hover:text-chazon-primary"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(slot.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function EditSlotForm({
  slot,
  onSave,
  onCancel,
}: {
  slot: AvailabilitySlot
  onSave: (updates: Partial<AvailabilitySlot>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isRecurring: slot.isRecurring,
    specificDate: slot.specificDate || '',
  })

  return (
    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
      <input
        type="time"
        value={formData.startTime}
        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <input
        type="time"
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        className="px-2 py-1 border border-gray-300 rounded text-sm"
      />
      {!formData.isRecurring && (
        <input
          type="date"
          value={formData.specificDate}
          onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          className="p-1 text-green-600 hover:text-green-700"
        >
          <Save className="h-4 w-4" />
        </button>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

