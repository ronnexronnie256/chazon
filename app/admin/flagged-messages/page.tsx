'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface FlaggedMessage {
  id: string;
  messageId: string;
  senderId: string;
  sender?: { name: string; email: string };
  recipientId?: string;
  recipient?: { name: string; email: string };
  taskId: string;
  originalContent: string;
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: FlaggedMessage[];
  error?: string;
}

export default function FlaggedMessagesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<FlaggedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>(
    'pending'
  );
  const [selectedMessage, setSelectedMessage] = useState<FlaggedMessage | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchFlaggedMessages();
  }, [isAuthenticated, router, user]);

  const fetchFlaggedMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/flagged-messages');
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flagged messages');
      }

      setMessages(data.data || []);
    } catch (error: any) {
      console.error('Error fetching flagged messages:', error);
      toast.error(error.message || 'Failed to load flagged messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (messageId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/flagged-messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminId: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      toast.success(`Action '${action}' applied successfully`);
      fetchFlaggedMessages();
      setSelectedMessage(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update message');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationLabel = (type: string) => {
    const labels: Record<string, string> = {
      PHONE_NUMBER: 'Phone Number',
      EMAIL: 'Email Address',
      WHATSAPP: 'WhatsApp Contact',
      SOCIAL_MEDIA: 'Social Media',
      EXTERNAL_LINK: 'External Link',
      CONTACT_SHARING_PHRASE: 'Contact Phrase',
    };
    return labels[type] || type;
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'pending') return !msg.reviewed;
    if (filter === 'reviewed') return msg.reviewed;
    return true;
  });

  const stats = {
    total: messages.length,
    pending: messages.filter(m => !m.reviewed).length,
    highSeverity: messages.filter(m => m.severity === 'HIGH' && !m.reviewed)
      .length,
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Flagged Messages
                </h1>
                <p className="mt-1 text-gray-600">
                  Monitor and review messages that violate platform guidelines
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Flagged</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Severity</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.highSeverity}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('reviewed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'reviewed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Reviewed
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Messages Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No flagged messages
              </h3>
              <p className="text-gray-600">
                {filter === 'pending'
                  ? 'All flagged messages have been reviewed.'
                  : 'No messages match this filter.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map(message => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                            message.severity
                          )}`}
                        >
                          {message.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {getViolationLabel(message.violationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-3">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {message.sender?.name || message.senderId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {message.sender?.email || 'Email not available'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {message.originalContent.substring(0, 50)}
                          {message.originalContent.length > 50 ? '...' : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}{' '}
                        <br />
                        <span className="text-xs">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {message.reviewed ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {message.action || 'Reviewed'}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedMessage(message)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Message Details
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Severity</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                      selectedMessage.severity
                    )}`}
                  >
                    {selectedMessage.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Violation Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getViolationLabel(selectedMessage.violationType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sender</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMessage.sender?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedMessage.sender?.email || selectedMessage.senderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Original Message</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedMessage.originalContent}
                  </p>
                </div>
              </div>
              {selectedMessage.reviewed && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Reviewed:</strong> {selectedMessage.action} by{' '}
                    {selectedMessage.reviewedBy} on{' '}
                    {new Date(
                      selectedMessage.reviewedAt || ''
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {!selectedMessage.reviewed && (
              <div className="p-6 border-t bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Take Action:
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      handleReview(selectedMessage.id, 'DISMISSED')
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Dismiss (No Violation)
                  </button>
                  <button
                    onClick={() => handleReview(selectedMessage.id, 'WARN')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Warn User
                  </button>
                  <button
                    onClick={() => handleReview(selectedMessage.id, 'SUSPEND')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  >
                    Suspend User
                  </button>
                  <button
                    onClick={() => handleReview(selectedMessage.id, 'BAN')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Ban User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
