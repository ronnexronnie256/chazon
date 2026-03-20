import { prisma } from '@/lib/prisma';

interface LogSecurityEventParams {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  userId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logSecurityEvent(params: LogSecurityEventParams) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: params.type,
        severity: params.severity,
        userId: params.userId,
        ipAddress: params.ipAddress,
        details: params.details || {},
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
