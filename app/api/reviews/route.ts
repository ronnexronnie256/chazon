import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, revieweeId, rating, comment } = body;

    // Validation
    if (!taskId || !revieweeId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: taskId, revieweeId, rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if task exists and user is involved
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: true,
        steward: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify user is either client or steward of this task
    const isClient = task.clientId === user.id;
    const isSteward = task.stewardId === user.id;

    if (!isClient && !isSteward) {
      return NextResponse.json(
        { error: "You can only review tasks you are involved in" },
        { status: 403 }
      );
    }

    // Verify reviewee is the other party (client reviews steward, steward reviews client)
    const expectedRevieweeId = isClient ? task.stewardId : task.clientId;
    if (revieweeId !== expectedRevieweeId) {
      return NextResponse.json(
        { error: "Invalid reviewee. You can only review the other party" },
        { status: 400 }
      );
    }

    // Check if task is completed
    if (task.status !== "DONE") {
      return NextResponse.json(
        { error: "You can only review completed tasks" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        taskId_reviewerId: {
          taskId,
          reviewerId: user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this task" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        taskId,
        reviewerId: user.id,
        revieweeId,
        rating,
        comment: comment || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update reviewee's rating (if steward, update StewardProfile)
    await updateUserRating(revieweeId);

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews
 * Get reviews for a user or task
 * Query params: ?userId=xxx or ?taskId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const taskId = searchParams.get("taskId");

    if (!userId && !taskId) {
      return NextResponse.json(
        { error: "Either userId or taskId is required" },
        { status: 400 }
      );
    }

    const where: any = {};
    if (userId) {
      where.revieweeId = userId;
    }
    if (taskId) {
      where.taskId = taskId;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        task: {
          select: {
            id: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average rating if userId is provided
    let averageRating = null;
    let totalReviews = 0;
    if (userId) {
      const stats = await prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: true,
      });
      averageRating = stats._avg.rating || 0;
      totalReviews = stats._count || 0;
    }

    return NextResponse.json({
      success: true,
      data: reviews,
      stats: userId
        ? {
            averageRating,
            totalReviews,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update user rating
 */
async function updateUserRating(userId: string) {
  try {
    // Get all reviews for this user
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    // Calculate average rating
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Check if user is a steward and update StewardProfile
    const stewardProfile = await prisma.stewardProfile.findUnique({
      where: { userId },
    });

    if (stewardProfile) {
      await prisma.stewardProfile.update({
        where: { userId },
        data: {
          rating: averageRating,
        },
      });
    }

    // Note: We could also store client ratings in a separate table or User model
    // For now, we'll just update steward ratings
  } catch (error) {
    console.error("Error updating user rating:", error);
  }
}

