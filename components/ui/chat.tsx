'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ImageIcon,
  Send,
  Upload,
  Flag,
  Check,
  CheckCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';
import { subscribeToTaskMessages } from '@/lib/supabase/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  content: string;
  contentType: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
  readAt?: string | null;
  createdAt: string;
}

interface ChatProps {
  taskId: string;
  currentUserId: string;
}

export function Chat({ taskId, currentUserId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [reportModal, setReportModal] = useState<{
    open: boolean;
    message?: ChatMessage;
  }>({ open: false });
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        toast.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    let channel: RealtimeChannel | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      channel = subscribeToTaskMessages(
        taskId,
        newMessage => {
          console.log('[Chat] New realtime message:', newMessage.id);
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
        error => {
          console.error(
            '[Chat] Realtime error, falling back to polling:',
            error
          );
          setRealtimeConnected(false);
          if (!pollInterval) {
            pollInterval = setInterval(fetchMessages, 5000);
          }
        }
      );

      channel.on('system', { event: 'connected' }, () => {
        console.log('[Chat] Realtime connected');
        setRealtimeConnected(true);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      });
    } catch (error) {
      console.error('[Chat] Error setting up Realtime:', error);
      pollInterval = setInterval(fetchMessages, 5000);
    }

    return () => {
      if (channel) channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [taskId]);

  // Send text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await fetch(`/api/chat/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          contentType: 'TEXT',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image to Supabase
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'chat');
      uploadFormData.append(
        'fileName',
        `chat-${taskId}-${Date.now()}-${file.name}`
      );

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // Send image message
      const response = await fetch(`/api/chat/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: imageUrl,
          contentType: 'IMAGE',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error((error as Error).message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReportMessage = async () => {
    if (!reportModal.message || !reportReason) return;

    setIsReporting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          messageId: reportModal.message.id,
          reporterId: currentUserId,
          reportedUserId: reportModal.message.senderId,
          reason: reportReason,
          messageContent: reportModal.message.content,
        }),
      });

      if (response.ok) {
        toast.success(
          'Report submitted. Thank you for keeping our community safe.'
        );
        setReportModal({ open: false });
        setReportReason('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {messages[0]?.sender?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {messages[0]?.sender?.name || 'Chat'}
            </p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {realtimeConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Wifi className="h-3 w-3" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <WifiOff className="h-3 w-3" />
              Polling
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwnMessage = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 group ${
                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={message.sender.image}
                    alt={message.sender.name}
                  />
                  <AvatarFallback>
                    {message.sender.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col max-w-[70%] ${
                    isOwnMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 relative ${
                      isOwnMessage
                        ? 'bg-chazon-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!isOwnMessage && (
                      <button
                        onClick={() => setReportModal({ open: true, message })}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        title="Report message"
                      >
                        <Flag className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                    {message.contentType === 'IMAGE' ? (
                      <div className="relative w-full max-w-sm">
                        <Image
                          src={message.content}
                          alt="Shared image"
                          width={400}
                          height={300}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                  {isOwnMessage ? (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(message.createdAt)}
                      </span>
                      {message.readAt ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 mt-1">
                      {formatDateTime(message.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={uploadingImage}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || isSending}
            title="Upload image"
          >
            {uploadingImage ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending || uploadingImage}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending || uploadingImage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Messages are only visible to you and the other party. Sharing phone
          numbers, emails, WhatsApp links, or social media profiles is not
          allowed for your safety and to protect the platform.
        </p>
      </div>

      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Report Message
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Help us understand why you&apos;re reporting this message from{' '}
              <strong>{reportModal.message?.sender.name}</strong>:
            </p>
            <div className="space-y-3 mb-6">
              {[
                { value: 'HARASSMENT', label: 'Harassment or bullying' },
                { value: 'SPAM', label: 'Spam or advertising' },
                { value: 'OFF_PLATFORM', label: 'Trying to move off-platform' },
                { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
                { value: 'OTHER', label: 'Other' },
              ].map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={option.value}
                    checked={reportReason === option.value}
                    onChange={e => setReportReason(e.target.value)}
                    className="h-4 w-4 text-chazon-primary"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReportModal({ open: false });
                  setReportReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportMessage}
                disabled={!reportReason || isReporting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
