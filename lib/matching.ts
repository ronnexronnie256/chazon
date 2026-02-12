import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils";

export interface StewardMatch {
  stewardId: string;
  serviceId: string;
  score: number;
  distance?: number;
  isAvailable: boolean;
  reasons: string[];
  isRecommended?: boolean;
}

export interface MatchingOptions {
  category?: string;
  search?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  maxDistance?: number; // in km
  minRating?: number;
  maxPrice?: number;
}

/**
 * Check if a steward is available for a given time slot
 */
async function checkAvailability(
  stewardId: string,
  scheduledStart: Date,
  scheduledEnd?: Date
): Promise<boolean> {
  // Get steward's availability slots
  const availabilitySlots = await prisma.availabilitySlot.findMany({
    where: { stewardId },
  });

  if (availabilitySlots.length === 0) {
    // No availability slots = assume always available
    return true;
  }

  const taskDayOfWeek = scheduledStart.getDay();
  const taskStartTime = scheduledStart.toTimeString().slice(0, 5); // "HH:MM"
  const taskEndTime = scheduledEnd
    ? scheduledEnd.toTimeString().slice(0, 5)
    : null;

  // Check if there's an availability slot that matches
  for (const slot of availabilitySlots) {
    // Check recurring slots
    if (slot.isRecurring && slot.dayOfWeek === taskDayOfWeek) {
      if (taskStartTime >= slot.startTime) {
        if (taskEndTime) {
          if (taskEndTime <= slot.endTime) {
            return true;
          }
        } else {
          // No end time specified, just check if start is within slot
          return true;
        }
      }
    }

    // Check specific date slots
    if (!slot.isRecurring && slot.specificDate) {
      const slotDate = new Date(slot.specificDate);
      const taskDate = new Date(scheduledStart);
      if (
        slotDate.toDateString() === taskDate.toDateString() &&
        taskStartTime >= slot.startTime
      ) {
        if (taskEndTime) {
          if (taskEndTime <= slot.endTime) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if steward has conflicting tasks
 */
async function hasConflictingTasks(
  stewardId: string,
  scheduledStart: Date,
  scheduledEnd?: Date
): Promise<boolean> {
  const endTime = scheduledEnd || new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const conflictingTasks = await prisma.task.findFirst({
    where: {
      stewardId,
      status: {
        in: ["OPEN", "ASSIGNED", "IN_PROGRESS"],
      },
      OR: [
        {
          scheduledStart: {
            gte: scheduledStart,
            lte: endTime,
          },
        },
        {
          scheduledEnd: {
            gte: scheduledStart,
            lte: endTime,
          },
        },
        {
          AND: [
            { scheduledStart: { lte: scheduledStart } },
            {
              scheduledEnd: {
                gte: endTime,
              },
            },
          ],
        },
      ],
    },
  });

  return !!conflictingTasks;
}

/**
 * Calculate matching score for a steward
 * Score is 0-100, higher is better
 */
function calculateMatchScore(
  distance: number | null,
  rating: number,
  price: number,
  maxPrice: number,
  isAvailable: boolean,
  hasConflict: boolean
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Distance score (0-30 points)
  // Closer = higher score
  if (distance !== null) {
    if (distance <= 1) {
      score += 30;
      reasons.push("Very close");
    } else if (distance <= 5) {
      score += 25;
      reasons.push("Close by");
    } else if (distance <= 10) {
      score += 20;
      reasons.push("Nearby");
    } else if (distance <= 20) {
      score += 15;
      reasons.push("Within range");
    } else {
      score += 10;
      reasons.push("Far away");
    }
  } else {
    // No location data, give neutral score
    score += 15;
  }

  // Rating score (0-30 points)
  // Higher rating = higher score
  if (rating >= 4.5) {
    score += 30;
    reasons.push("Excellent rating");
  } else if (rating >= 4.0) {
    score += 25;
    reasons.push("Great rating");
  } else if (rating >= 3.5) {
    score += 20;
    reasons.push("Good rating");
  } else if (rating >= 3.0) {
    score += 15;
    reasons.push("Average rating");
  } else if (rating > 0) {
    score += 10;
    reasons.push("Low rating");
  } else {
    // New steward, give neutral score
    score += 15;
    reasons.push("New steward");
  }

  // Price score (0-25 points)
  // Lower price = higher score (normalized)
  if (maxPrice > 0) {
    const priceRatio = price / maxPrice;
    if (priceRatio <= 0.5) {
      score += 25;
      reasons.push("Great price");
    } else if (priceRatio <= 0.7) {
      score += 20;
      reasons.push("Good price");
    } else if (priceRatio <= 0.9) {
      score += 15;
      reasons.push("Fair price");
    } else {
      score += 10;
      reasons.push("Higher price");
    }
  } else {
    // No max price, give neutral score
    score += 15;
  }

  // Availability score (0-15 points)
  if (isAvailable && !hasConflict) {
    score += 15;
    reasons.push("Available");
  } else if (hasConflict) {
    score += 0;
    reasons.push("Has conflicting tasks");
  } else {
    score += 5;
    reasons.push("May not be available");
  }

  return { score, reasons };
}

/**
 * Find and rank matching stewards for a task
 */
export async function findMatchingStewards(
  options: MatchingOptions
): Promise<StewardMatch[]> {
  const {
    category,
    clientLatitude,
    clientLongitude,
    scheduledStart,
    scheduledEnd,
    maxDistance,
    minRating,
    maxPrice,
  } = options;

  // Build query for service offerings
  const where: any = {};

  if (category) {
    where.category = {
      equals: category,
      mode: "insensitive",
    };
  }

  // Note: search parameter not in MatchingOptions, removed search functionality

  if (maxPrice) {
    where.price = {
      lte: maxPrice,
    };
  }

  // Ensure only approved stewards are shown
  where.steward = {
    is: {
      status: "APPROVED"
    }
  };

  // Get all matching service offerings
  const offerings = await prisma.serviceOffering.findMany({
    where,
    include: {
      steward: {
        include: {
          user: true,
        },
      },
    },
  });

  // Filter and score each steward
  const matches: StewardMatch[] = [];

  for (const offering of offerings) {
    const steward = offering.steward;
    const stewardLat = steward.latitude;
    const stewardLng = steward.longitude;

    // Check rating filter
    if (minRating && steward.rating < minRating) {
      continue;
    }

    // Calculate distance if location data available
    let distance: number | null = null;
    if (
      clientLatitude &&
      clientLongitude &&
      stewardLat &&
      stewardLng
    ) {
      // Convert to km (calculateDistance returns miles)
      distance = calculateDistance(
        clientLatitude,
        clientLongitude,
        stewardLat,
        stewardLng
      ) * 1.60934; // Convert miles to km

      // Check max distance filter
      if (maxDistance && distance > maxDistance) {
        continue;
      }

      // Check service radius
      if (distance > steward.serviceRadius) {
        continue;
      }
    }

    // Check availability
    let isAvailable = true;
    let hasConflict = false;

    if (scheduledStart) {
      isAvailable = await checkAvailability(
        steward.id,
        scheduledStart,
        scheduledEnd
      );
      hasConflict = await hasConflictingTasks(
        steward.userId,
        scheduledStart,
        scheduledEnd
      );
    }

    // Calculate match score
    const { score, reasons } = calculateMatchScore(
      distance,
      steward.rating,
      offering.price,
      maxPrice || offering.price * 2, // Default max price if not specified
      isAvailable,
      hasConflict
    );

    matches.push({
      stewardId: steward.userId,
      serviceId: offering.id,
      score,
      distance: distance || undefined,
      isAvailable: isAvailable && !hasConflict,
      reasons,
    });
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Mark top N stewards as recommended
 */
export function markRecommended(matches: StewardMatch[], topN: number = 3): StewardMatch[] {
  return matches.map((match, index) => ({
    ...match,
    isRecommended: index < topN && match.score >= 60, // Only recommend if score is at least 60
  }));
}

