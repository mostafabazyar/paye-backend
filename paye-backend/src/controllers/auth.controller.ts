// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Set OTP expiry (e.g., 5 minutes)
const OTP_EXPIRY_MINUTES = 5;

export const login = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Validate phone format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete any existing OTPs for this phone (to avoid duplicates)
    await prisma.otp.deleteMany({
      where: { phone }
    });

    // Save OTP to database
    await prisma.otp.create({
      data: {
        phone,
        otp,
        expiresAt,
        used: false
      }
    });

    // ←←← CONSOLE LOG FOR DEVELOPMENT
    console.log('\n🔐 ==================== NEW OTP ====================');
    console.log(`📱 Phone : ${phone}`);
    console.log(`🔑 OTP   : ${otp}`);
    console.log(`⏰ Expires in: ${OTP_EXPIRY_MINUTES} minutes`);
    console.log('==================================================\n');

    // In real production, send OTP via SMS (Twilio, etc.)
    // For now, we just log it

    res.json({ 
      success: true, 
      message: "OTP sent successfully. Check console for OTP (development mode).", 
      phone,
      expiresIn: OTP_EXPIRY_MINUTES * 60 // seconds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    console.log(`🔍 Verifying OTP for ${phone} → ${otp}`);

    // Find valid OTP in database
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        otp,
        used: false,
        expiresAt: {
          gt: new Date() // OTP not expired
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent OTP if multiple exist
      }
    });

    // Check if OTP is valid
    if (!otpRecord) {
      // Check if there's an expired OTP to give a better error message
      const expiredOtp = await prisma.otp.findFirst({
        where: {
          phone,
          otp,
          used: false,
          expiresAt: {
            lte: new Date()
          }
        }
      });

      if (expiredOtp) {
        return res.status(400).json({ 
          success: false, 
          message: 'OTP has expired. Please request a new one.' 
        });
      }

      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({ 
      where: { phone } 
    });

    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          isVerified: true,
        }
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Format user response
    const userResponse = {
      id: user.id,
      phone: user.phone,
      name: user.name || null,
      age: user.age || null,
      gender: user.gender || null,
      interestedIn: user.interestedIn || 'EVERYONE',
      preferredSports: user.preferredSports ? user.preferredSports.split(',').filter(Boolean) : [],
      preferredSessionTypes: user.preferredSessionTypes ? user.preferredSessionTypes.split(',').filter(Boolean) : [],
      bio: user.bio || null,
      photos: user.photos ? JSON.parse(user.photos) : [],
      avgRating: user.avgRating,
      isVerified: user.isVerified,
    };

    res.json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
      isNewUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Optional: Resend OTP endpoint
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete old OTPs
    await prisma.otp.deleteMany({
      where: { phone }
    });

    // Save new OTP
    await prisma.otp.create({
      data: {
        phone,
        otp,
        expiresAt,
        used: false
      }
    });

    console.log('\n🔄 ==================== RESENT OTP ====================');
    console.log(`📱 Phone : ${phone}`);
    console.log(`🔑 OTP   : ${otp}`);
    console.log('==================================================\n');

    res.json({ 
      success: true, 
      message: "New OTP sent successfully",
      expiresIn: OTP_EXPIRY_MINUTES * 60
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};