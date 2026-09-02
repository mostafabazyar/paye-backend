import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OTPQuery {
  phone?: string;
}

export const getOTPByPhone = async (req: Request<{}, {}, {}, OTPQuery>, res: Response) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const otp = await prisma.otp.findFirst({
      where: {
        phone: phone as string,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otp) {
      return res.status(404).json({
        success: false,
        message: 'No active OTP found for this phone'
      });
    }

    return res.json({
      success: true,
      data: otp
    });
  } catch (error) {
    console.error('Error fetching OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OTP'
    });
  }
};

export const getAllActiveOTPs = async (req: Request, res: Response) => {
  try {
    const otps = await prisma.otp.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return res.json({
      success: true,
      data: otps
    });
  } catch (error) {
    console.error('Error fetching all OTPs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch OTPs'
    });
  }
};