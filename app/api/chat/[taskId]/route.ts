import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is the client or steward for this task
    if (user.id !== task.clientId && user.id !== task.stewardId) {
      return NextResponse.json(
        { error: "Unauthorized to view this chat" },
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
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read for the current user (only messages not sent by them)
    const unreadMessageIds = messages
      .filter((msg) => msg.senderId !== user.id && !msg.readAt)
      .map((msg) => msg.id);

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
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { content, contentType = "TEXT" } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ["TEXT", "IMAGE", "LOCATION"];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Contact sharing restrictions (FR-25)
    // Prevent sharing phone numbers, emails, WhatsApp links, social media, and external links
    if (contentType === "TEXT") {
      const textContent = content.toLowerCase();
      const originalContent = content; // Keep original for better detection
      
      // Check for phone numbers (various formats including Uganda)
      const phonePatterns = [
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // US format: 123-456-7890
        /\b\+?\d{10,15}\b/, // International format: +1234567890 or 1234567890
        /\b\d{3}\s?\d{3}\s?\d{4}\b/, // Space-separated: 123 456 7890
        /\b0\d{9}\b/, // Uganda format: 0700123456
        /\b\+256\d{9}\b/, // Uganda international: +256700123456
        /\b256\d{9}\b/, // Uganda without plus: 256700123456
        /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b/, // Various separators
        /call\s+me\s+at\s+[\d\s\+\-\(\)]+/i, // "call me at 123..."
        /phone\s*:?\s*[\d\s\+\-\(\)]+/i, // "phone: 123..."
        /contact\s+me\s+at\s+[\d\s\+\-\(\)]+/i, // "contact me at 123..."
        /reach\s+me\s+at\s+[\d\s\+\-\(\)]+/i, // "reach me at 123..."
      ];
      
      // Check for email addresses
      const emailPatterns = [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Standard email
        /email\s*:?\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i, // "email: user@example.com"
        /contact\s+me\s+at\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i, // "contact me at user@example.com"
        /reach\s+me\s+at\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i, // "reach me at user@example.com"
      ];
      
      // Check for WhatsApp links and references
      const whatsappPatterns = [
        /wa\.me\/[\d\w]+/i, // wa.me/1234567890
        /whatsapp\.com\/send\?phone=[\d\w]+/i, // whatsapp.com/send?phone=123
        /whatsapp\s*:?\s*[\d\s\+\-\(\)]+/i, // "whatsapp: 123..."
        /whatsapp\s+me\s+at\s+[\d\s\+\-\(\)]+/i, // "whatsapp me at 123..."
        /text\s+me\s+on\s+whatsapp/i, // "text me on whatsapp"
        /message\s+me\s+on\s+whatsapp/i, // "message me on whatsapp"
      ];
      
      // Check for social media handles and links
      const socialMediaPatterns = [
        /@[\w]+/i, // @username (Twitter, Instagram, etc.)
        /instagram\.com\/[\w]+/i, // instagram.com/username
        /facebook\.com\/[\w]+/i, // facebook.com/username
        /twitter\.com\/[\w]+/i, // twitter.com/username
        /x\.com\/[\w]+/i, // x.com/username
        /linkedin\.com\/in\/[\w]+/i, // linkedin.com/in/username
        /tiktok\.com\/@[\w]+/i, // tiktok.com/@username
        /snapchat\.com\/add\/[\w]+/i, // snapchat.com/add/username
        /telegram\.me\/[\w]+/i, // telegram.me/username
        /t\.me\/[\w]+/i, // t.me/username
      ];
      
      // Check for external links (except images from our storage and allowed domains)
      const externalLinkPattern = /https?:\/\/(?!.*supabase\.co)(?!.*chazon\.com)(?!.*storage\.supabase\.co)[^\s]+/i;
      
      // Check for common contact sharing phrases
      const contactSharingPhrases = [
        /my\s+number\s+is/i, // "my number is"
        /call\s+me/i, // "call me"
        /text\s+me/i, // "text me"
        /dm\s+me/i, // "dm me"
        /direct\s+message/i, // "direct message"
        /private\s+message/i, // "private message"
        /hit\s+me\s+up/i, // "hit me up"
        /reach\s+out/i, // "reach out"
      ];
      
      // Validate phone numbers
      if (phonePatterns.some(pattern => pattern.test(originalContent))) {
        return NextResponse.json(
          { 
            error: "Sharing phone numbers is not allowed. Please use the in-app chat for all communication to ensure your safety and protect the platform.",
            code: "CONTACT_SHARING_RESTRICTED"
          },
          { status: 400 }
        );
      }
      
      // Validate email addresses
      if (emailPatterns.some(pattern => pattern.test(originalContent))) {
        return NextResponse.json(
          { 
            error: "Sharing email addresses is not allowed. Please use the in-app chat for all communication.",
            code: "CONTACT_SHARING_RESTRICTED"
          },
          { status: 400 }
        );
      }
      
      // Validate WhatsApp links
      if (whatsappPatterns.some(pattern => pattern.test(textContent))) {
        return NextResponse.json(
          { 
            error: "Sharing WhatsApp contact information is not allowed. Please use the in-app chat for all communication.",
            code: "CONTACT_SHARING_RESTRICTED"
          },
          { status: 400 }
        );
      }
      
      // Validate social media
      if (socialMediaPatterns.some(pattern => pattern.test(textContent))) {
        return NextResponse.json(
          { 
            error: "Sharing social media profiles is not allowed. Please use the in-app chat for all communication.",
            code: "CONTACT_SHARING_RESTRICTED"
          },
          { status: 400 }
        );
      }
      
      // Validate external links
      if (externalLinkPattern.test(originalContent)) {
        return NextResponse.json(
          { 
            error: "Sharing external links is not allowed for safety reasons. You can share images through the chat if needed.",
            code: "EXTERNAL_LINK_RESTRICTED"
          },
          { status: 400 }
        );
      }
      
      // Check for contact sharing phrases (warn but allow if no actual contact info)
      // This is a softer check - we'll allow the message but could log it for monitoring
      const hasContactPhrase = contactSharingPhrases.some(pattern => pattern.test(textContent));
      if (hasContactPhrase) {
        // If they're using contact phrases, check if they might be trying to share contact info
        // We'll allow it but could enhance this later with ML or more sophisticated detection
      }
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
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is the client or steward for this task
    if (user.id !== task.clientId && user.id !== task.stewardId) {
      return NextResponse.json(
        { error: "Unauthorized to send messages in this chat" },
        { status: 403 }
      );
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
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

