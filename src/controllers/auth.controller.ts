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

export const login = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Generate OTP
    const otp = generateOTP();

    // ←←← CONSOLE LOG FOR DEVELOPMENT
    console.log('\n🔐 ==================== NEW OTP ====================');
    console.log(`📱 Phone : ${phone}`);
    console.log(`🔑 OTP   : ${otp}`);
    console.log('==================================================\n');

    // In real production, send OTP via SMS (Twilio, etc.)
    // For now, we just log it

    res.json({ 
      success: true, 
      message: "OTP sent successfully. Check console for OTP (development mode).", 
      phone 
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

    res.json({
      success: true,
      message: "Login successful",
      user,
      token,
      isNewUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};