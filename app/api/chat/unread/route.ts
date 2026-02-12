import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chat/unread
 * Get unread message count for the current user
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tasks where user is either client or steward
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { stewardId: user.id },
        ],
      },
      select: { id: true },
    });

    const taskIds = tasks.map((t) => t.id);

    if (taskIds.length === 0) {
      return NextResponse.json({
        success: true,
        unreadCount: 0,
        conversations: [],
      });
    }

    // Get all messages for these tasks
    const allMessages = await prisma.chatMessage.findMany({
      where: {
        taskId: { in: taskIds },
      },
      include: {
        task: {
          select: {
            id: true,
            category: true,
            client: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            steward: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by task and get latest message per conversation
    const conversationsMap = new Map();
    let totalUnread = 0;

    // First, get all unique tasks and their other party
    for (const task of await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: {
        id: true,
        category: true,
        client: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        steward: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })) {
      const otherParty =
        task.client.id === user.id ? task.steward : task.client;
      if (otherParty) {
        conversationsMap.set(task.id, {
          taskId: task.id,
          taskCategory: task.category,
          otherParty,
          unreadCount: 0,
          latestMessage: null,
        });
      }
    }

    // Process messages to find latest and count unread
    for (const message of allMessages) {
      const conversation = conversationsMap.get(message.taskId);
      if (!conversation) continue;

      // Update latest message if this is more recent
      if (
        !conversation.latestMessage ||
        new Date(message.createdAt) >
          new Date(conversation.latestMessage.createdAt)
      ) {
        conversation.latestMessage = {
          content: message.content,
          contentType: message.contentType,
          createdAt: message.createdAt,
          sender: {
            name: message.sender.name,
          },
        };
      }

      // Count unread messages (not sent by user and not read)
      if (message.senderId !== user.id && !message.readAt) {
        conversation.unreadCount++;
        totalUnread++;
      }
    }

    // Filter out conversations with no messages and sort by latest message
    const conversations = Array.from(conversationsMap.values())
      .filter((conv) => conv.latestMessage !== null)
      .sort((a, b) => {
        if (!a.latestMessage || !b.latestMessage) return 0;
        return (
          new Date(b.latestMessage.createdAt).getTime() -
          new Date(a.latestMessage.createdAt).getTime()
        );
      });

    return NextResponse.json({
      success: true,
      unreadCount: totalUnread,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread messages" },
      { status: 500 }
    );
  }
}

