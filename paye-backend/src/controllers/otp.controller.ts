import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OTPQuery {
  phone?: string;
}

// Helper function to normalize phone number to 0 format
const normalizePhone = (phone: string): string => {
  // Remove spaces and special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remove + at the beginning
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it starts with 98 (Iran country code), convert to 0
  if (cleaned.startsWith('98')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // If it's 10 digits and doesn't start with 0, add 0
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // If it starts with 0098, convert to 0
  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  }
  
  return cleaned;
};

export const getOTPByPhone = async (req: Request<{}, {}, {}, OTPQuery>, res: Response) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Normalize the phone number (convert to 0 format)
    const normalizedPhone = normalizePhone(phone as string);
    console.log(`📞 Searching OTP for: ${normalizedPhone} (original: ${phone})`);

    const otp = await prisma.otp.findFirst({
      where: {
        phone: normalizedPhone,
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