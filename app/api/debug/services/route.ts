import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check service and steward status
 */
export async function GET() {
  try {
    // Get all services with their steward info
    const services = await prisma.serviceOffering.findMany({
      include: {
        steward: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Get all stewards with their status
    const stewards = await prisma.stewardProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        services: services.map(s => ({
          id: s.id,
          title: s.title,
          stewardId: s.stewardId,
          stewardName: s.steward.user.name,
          stewardEmail: s.steward.user.email,
          stewardStatus: s.steward.status,
          createdAt: s.createdAt,
        })),
        stewards: stewards.map(st => ({
          id: st.id,
          userId: st.userId,
          name: st.user.name,
          email: st.user.email,
          status: st.status,
          servicesCount: st.services.length,
        })),
        counts: {
          totalServices: services.length,
          totalStewards: stewards.length,
          approvedStewards: stewards.filter(s => s.status === 'APPROVED')
            .length,
          servicesWithApprovedStewards: services.filter(
            s => s.steward.status === 'APPROVED'
          ).length,
        },
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
