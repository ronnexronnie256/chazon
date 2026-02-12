"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, Send, Upload } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";
import { subscribeToTaskMessages } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up Realtime subscription for new messages
  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Subscribe to new messages via Supabase Realtime
    let channel: RealtimeChannel | null = null;

    try {
      channel = subscribeToTaskMessages(
        taskId,
        (newMessage) => {
          // Add new message to the list if it doesn't already exist
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
        (error) => {
          console.error("Realtime subscription error:", error);
          // Fallback to polling if Realtime fails
          toast.error("Real-time updates unavailable, using polling");
        }
      );
    } catch (error) {
      console.error("Error setting up Realtime subscription:", error);
      // Fallback to polling if Realtime setup fails
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }

    // Cleanup subscription on unmount or taskId change
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [taskId]);

  // Send text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const response = await fetch(`/api/chat/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          contentType: "TEXT",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.data]);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send message");
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image to Supabase
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "chat");
      uploadFormData.append(
        "fileName",
        `chat-${taskId}-${Date.now()}-${file.name}`
      );

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // Send image message
      const response = await fetch(`/api/chat/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: imageUrl,
          contentType: "IMAGE",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.data]);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error((error as Error).message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isOwnMessage ? "flex-row-reverse" : "flex-row"
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
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? "bg-chazon-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.contentType === "IMAGE" ? (
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
                  <span className="text-xs text-gray-500 mt-1">
                    {formatDateTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
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
            onChange={(e) => setNewMessage(e.target.value)}
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
          Messages are only visible to you and the other party. Sharing phone numbers, emails, WhatsApp links, or social media profiles is not allowed for your safety and to protect the platform.
        </p>
      </div>
    </div>
  );
}

