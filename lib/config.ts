import { prisma } from '@/lib/prisma'
 
export type SystemConfig = {
  id: string
  bookingsEnabled: boolean
  stewardAcceptEnabled: boolean
}
 
export async function getSystemConfig(): Promise<SystemConfig> {
  let config = await prisma.systemConfig.findFirst()
  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        bookingsEnabled: true,
        stewardAcceptEnabled: true,
      },
    })
  }
  return config as SystemConfig
}
