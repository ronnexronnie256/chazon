import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';
import {
  filterMessage,
  getHighestSeverity,
  ViolationType,
} from '@/lib/message-filter';

/**
 * GET /api/chat/[taskId]
 * Get all messages for a specific task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    // Verify user has access to this task (must be client or steward)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        clientId: true,
        stewardId: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is the client or steward for this task
    if (user.id !== task.clientId && user.id !== task.stewardId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this chat' },
        { status: 403 }
      );
    }

    // Get all messages for this task
    const messages = await prisma.chatMessage.findMany({
      where: { taskId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read for the current user (only messages not sent by them)
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== user.id && !msg.readAt)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.chatMessage.updateMany({
        where: {
          id: { in: unreadMessageIds },
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/[taskId]
 * Send a new message in a task chat
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { content, contentType = 'TEXT' } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['TEXT', 'IMAGE', 'LOCATION'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Verify user has access to this task (must be client or steward)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        clientId: true,
        stewardId: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is the client or steward for this task
    if (user.id !== task.clientId && user.id !== task.stewardId) {
      return NextResponse.json(
        { error: 'Unauthorized to send messages in this chat' },
        { status: 403 }
      );
    }

    // Contact sharing restrictions (FR-25)
    // Use the message filter to detect violations
    if (contentType === 'TEXT') {
      const filterResult = filterMessage(content, { blockOnViolation: true });

      if (!filterResult.isAllowed) {
        const severity = getHighestSeverity(filterResult.violations);
        const primaryViolation = filterResult.violations[0];

        // Get the other party in the conversation for flagging
        const recipientId =
          user.id === task.clientId ? task.stewardId : task.clientId;

        // Log the violation to database for admin review
        try {
          await prisma.flaggedMessage.create({
            data: {
              messageId: `blocked_${Date.now()}_${user.id}`,
              senderId: user.id,
              recipientId: recipientId,
              taskId: taskId,
              originalContent: content.substring(0, 1000),
              violationType: primaryViolation.type,
              severity: severity,
            },
          });
        } catch (logError) {
          console.error('Failed to log flagged message:', logError);
        }

        // Log security event
        await prisma.securityEvent.create({
          data: {
            userId: user.id,
            type: `CHAT_VIOLATION_${primaryViolation.type}`,
            severity: severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            details: {
              taskId,
              violationTypes: filterResult.violations.map((v: any) => v.type),
              contentLength: content.length,
            },
          },
        });

        // Return appropriate error message based on severity
        const errorMessages: Record<string, string> = {
          PHONE_NUMBER:
            'Sharing phone numbers is not allowed. All communication must go through Chazon to protect both parties.',
          EMAIL:
            'Sharing email addresses is not allowed. Please use the in-app chat for all communication.',
          WHATSAPP:
            'Sharing WhatsApp contact information is not allowed. Please use the in-app chat for all communication.',
          SOCIAL_MEDIA:
            'Sharing social media references is not allowed. All communication should stay on Chazon.',
          EXTERNAL_LINK:
            'External links are not allowed in messages. Please keep all communication on Chazon.',
          CONTACT_SHARING_PHRASE:
            'Please avoid suggesting off-platform communication. For your safety, all communication should stay on Chazon.',
        };

        return NextResponse.json(
          {
            error:
              errorMessages[primaryViolation.type] ||
              'This message contains prohibited content.',
            code: 'CONTACT_SHARING_RESTRICTED',
            violation: primaryViolation.type,
          },
          { status: 400 }
        );
      }

      // Log MEDIUM/LOW violations for monitoring (but allow the message)
      if (filterResult.violations.length > 0) {
        const severity = getHighestSeverity(filterResult.violations);
        if (severity !== 'HIGH') {
          await prisma.securityEvent
            .create({
              data: {
                userId: user.id,
                type: `CHAT_WARNING_${filterResult.violations[0].type}`,
                severity: 'LOW',
                details: {
                  taskId,
                  violations: filterResult.violations.map((v: any) => v.type),
                },
              },
            })
            .catch(console.error);
        }
      }
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        taskId,
        senderId: user.id,
        content: content.trim(),
        contentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
