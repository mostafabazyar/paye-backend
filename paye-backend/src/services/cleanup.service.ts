// src/services/cleanup.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
  } catch (error) {
    console.error('Failed to cleanup OTPs:', error);
  }
};

// Run every hour
setInterval(cleanupExpiredOTPs, 3600000);