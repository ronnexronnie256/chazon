"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Chat } from "@/components/ui/chat";
import { useAuthStore } from "@/store/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Calendar, MapPin, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { subscribeToConversations } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Conversation {
  taskId: string;
  taskCategory: string;
  otherParty: {
    id: string;
    name: string;
    image?: string;
  };
  unreadCount: number;
  latestMessage: {
    content: string;
    contentType: string;
    createdAt: string;
    sender: {
      name: string;
    };
  };
}

export default function ChatPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect("/auth/signin");
    }

    // Initial fetch
    fetchConversations();

    // Set up Realtime subscription for conversation updates
    let channel: RealtimeChannel | null = null;

    try {
      channel = subscribeToConversations(
        user.id,
        () => {
          // Refresh conversations when new messages arrive
          fetchConversations();
        },
        (error) => {
          console.error("Realtime subscription error:", error);
          // Fallback to polling if Realtime fails
          const interval = setInterval(fetchConversations, 5000);
          return () => clearInterval(interval);
        }
      );
    } catch (error) {
      console.error("Error setting up Realtime subscription:", error);
      // Fallback to polling if Realtime setup fails
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [isAuthenticated, user]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/unread");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setConversations([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Chat with clients and stewards about your tasks
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Conversations</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading conversations...</p>
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.taskId}
                        onClick={() => setSelectedTaskId(conv.taskId)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedTaskId === conv.taskId
                            ? "bg-chazon-primary text-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage
                              src={conv.otherParty.image}
                              alt={conv.otherParty.name}
                            />
                            <AvatarFallback>
                              {conv.otherParty.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className={`font-medium truncate ${
                                  selectedTaskId === conv.taskId
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {conv.otherParty.name}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge
                                  variant={
                                    selectedTaskId === conv.taskId
                                      ? "secondary"
                                      : "default"
                                  }
                                  className="ml-2"
                                >
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`text-xs truncate ${
                                selectedTaskId === conv.taskId
                                  ? "text-white/80"
                                  : "text-gray-500"
                              }`}
                            >
                              {conv.latestMessage.contentType === "IMAGE"
                                ? "📷 Image"
                                : conv.latestMessage.content.length > 30
                                ? conv.latestMessage.content.substring(0, 30) +
                                  "..."
                                : conv.latestMessage.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                selectedTaskId === conv.taskId
                                  ? "text-white/60"
                                  : "text-gray-400"
                              }`}
                            >
                              {new Date(
                                conv.latestMessage.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No conversations yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Start chatting when you have active tasks
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedTaskId ? (
                <Chat taskId={selectedTaskId} currentUserId={user.id} />
              ) : (
                <Card className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start chatting
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

