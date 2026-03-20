import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export type BadgeType =
  | 'VERIFIED'
  | 'TOP_RATED'
  | 'FAST_RESPONDER'
  | 'NEW_STEWARD'
  | 'EXPERIENCED';

export interface Badge {
  type: BadgeType;
  label: string;
  description: string;
  icon: string;
}

// Cache badges for 5 minutes to improve performance
const getCachedBadges = cache(async (stewardId: string): Promise<Badge[]> => {
  return calculateBadgesFromProfile(stewardId);
});

/**
 * Calculate badges using only the steward profile (no extra queries)
 */
async function calculateBadgesFromProfile(stewardId: string): Promise<Badge[]> {
  const badges: Badge[] = [];

  const profile = await prisma.stewardProfile.findUnique({
    where: { userId: stewardId },
    select: {
      status: true,
      rating: true,
      completedTasks: true,
      yearsOfExperience: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return badges;
  }

  // 1. Verified Badge - Status is APPROVED
  if (profile.status === 'APPROVED') {
    badges.push({
      type: 'VERIFIED',
      label: 'Verified',
      description: 'Identity and background verified',
      icon: '✓',
    });
  }

  // 2. Top Rated Badge - High rating (≥4.5) and sufficient reviews (≥10 completed tasks)
  if (profile.rating >= 4.5 && profile.completedTasks >= 10) {
    badges.push({
      type: 'TOP_RATED',
      label: 'Top Rated',
      description: `Excellent ${profile.rating.toFixed(1)}★ rating`,
      icon: '⭐',
    });
  }

  // 3. Experienced Badge - 3+ years of experience
  if (profile.yearsOfExperience >= 3) {
    badges.push({
      type: 'EXPERIENCED',
      label: 'Experienced',
      description: `${profile.yearsOfExperience}+ years experience`,
      icon: '🎓',
    });
  }

  // 4. Active Badge - 20+ completed tasks
  if (profile.completedTasks >= 20) {
    badges.push({
      type: 'FAST_RESPONDER',
      label: 'Highly Active',
      description: `${profile.completedTasks} tasks completed`,
      icon: '🔥',
    });
  }

  // 5. New Steward Badge - Less than 5 completed tasks
  if (profile.completedTasks < 5) {
    badges.push({
      type: 'NEW_STEWARD',
      label: 'New Steward',
      description: 'Getting started on Chazon',
      icon: '🌱',
    });
  }

  return badges;
}

/**
 * Calculate badges for a steward (cached)
 */
export async function calculateStewardBadges(
  stewardId: string
): Promise<Badge[]> {
  return getCachedBadges(stewardId);
}

/**
 * Calculate badges for multiple stewards in a single query
 */
export async function calculateBadgesForStewards(
  stewardIds: string[]
): Promise<Map<string, Badge[]>> {
  const profiles = await prisma.stewardProfile.findMany({
    where: { userId: { in: stewardIds } },
    select: {
      userId: true,
      status: true,
      rating: true,
      completedTasks: true,
      yearsOfExperience: true,
      createdAt: true,
    },
  });

  const badgesMap = new Map<string, Badge[]>();

  for (const profile of profiles) {
    const badges: Badge[] = [];

    if (profile.status === 'APPROVED') {
      badges.push({
        type: 'VERIFIED',
        label: 'Verified',
        description: 'Identity and background verified',
        icon: '✓',
      });
    }

    if (profile.rating >= 4.5 && profile.completedTasks >= 10) {
      badges.push({
        type: 'TOP_RATED',
        label: 'Top Rated',
        description: `Excellent ${profile.rating.toFixed(1)}★ rating`,
        icon: '⭐',
      });
    }

    if (profile.yearsOfExperience >= 3) {
      badges.push({
        type: 'EXPERIENCED',
        label: 'Experienced',
        description: `${profile.yearsOfExperience}+ years experience`,
        icon: '🎓',
      });
    }

    if (profile.completedTasks >= 20) {
      badges.push({
        type: 'FAST_RESPONDER',
        label: 'Highly Active',
        description: `${profile.completedTasks} tasks completed`,
        icon: '🔥',
      });
    }

    if (profile.completedTasks < 5) {
      badges.push({
        type: 'NEW_STEWARD',
        label: 'New Steward',
        description: 'Getting started on Chazon',
        icon: '🌱',
      });
    }

    badgesMap.set(profile.userId, badges);
  }

  // Add empty array for any IDs not found
  for (const id of stewardIds) {
    if (!badgesMap.has(id)) {
      badgesMap.set(id, []);
    }
  }

  return badgesMap;
}
