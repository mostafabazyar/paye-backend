import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

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
  
  // If it starts with 0098, convert to 0
  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  }
  
  // If it's 10 digits and doesn't start with 0, add 0
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
};

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

    // Normalize the phone number (convert to 0 format)
    const normalizedPhone = normalizePhone(phone);
    console.log(`📱 Login attempt for: ${normalizedPhone} (original: ${phone})`);

    // Validate phone format - accepts 0 at the beginning
    // Format: starts with 0, followed by 10 digits (total 11 digits)
    // Or with +98 format
    const phoneRegex = /^(0[0-9]{10}|\+?98[0-9]{10}|[0-9]{10,11})$/;
    if (!phoneRegex.test(normalizedPhone) && !phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Please enter a valid phone number.' 
      });
    }

    // Additional validation for Iranian phone numbers
    if (!/^0[0-9]{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number. Must start with 0 and have 11 digits (e.g., 09125239708)' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete any existing OTPs for this phone (to avoid duplicates)
    await prisma.otp.deleteMany({
      where: { phone: normalizedPhone }
    });

    // Save OTP to database with normalized phone
    await prisma.otp.create({
      data: {
        phone: normalizedPhone,
        otp,
        expiresAt,
        used: false
      }
    });

    // Console log for development
    console.log('\n🔐 ==================== NEW OTP ====================');
    console.log(`📱 Phone : ${normalizedPhone}`);
    console.log(`🔑 OTP   : ${otp}`);
    console.log(`⏰ Expires in: ${OTP_EXPIRY_MINUTES} minutes`);
    console.log('==================================================\n');

    res.json({ 
      success: true, 
      message: "OTP sent successfully. Check console for OTP (development mode).", 
      phone: normalizedPhone,
      expiresIn: OTP_EXPIRY_MINUTES * 60
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

    const normalizedPhone = normalizePhone(phone);
    console.log(`🔍 Verifying OTP for ${normalizedPhone} → ${otp}`);

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone: normalizedPhone,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      const expiredOtp = await prisma.otp.findFirst({
        where: {
          phone: normalizedPhone,
          otp,
          used: false,
          expiresAt: { lte: new Date() },
        },
      });

      if (expiredOtp) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Mark OTP used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // --- PATTERN B ---
    // 1. If a real User already exists (completed setup previously), log them in.
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      const token = jwt.sign(
        { id: existingUser.id, phone: existingUser.phone, type: 'USER' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        phase: 'USER',
        user: formatUserResponse(existingUser),
        token,
        isNewUser: false,
      });
    }

    // 2. No User yet → ensure a DraftUser exists (create if missing)
    let draft = await prisma.draftUser.findFirst({
      where: { phone: normalizedPhone },
    });

    if (!draft) {
      draft = await prisma.draftUser.create({
        data: {
          phone: normalizedPhone,
          lastStep: 1,
        },
      });
    }

    // Token carries draft.id + phase. Middleware and other controllers
    // must branch on `phase === 'DRAFT'`.
    const token = jwt.sign(
      { id: draft.id, phone: draft.phone, type: 'DRAFT' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'OTP verified. Continue with profile setup.',
      phase: 'DRAFT',
      user: {
        id: draft.id,
        phone: draft.phone,
        name: draft.name ?? null,
        isVerified: false,
      },
      token,
      isNewUser: true,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Reuse this — extract once, use in both branches
const formatUserResponse = (user: any) => ({
  id: user.id,
  phone: user.phone,
  name: user.name || null,
  birthDate: user.birthDate || null,
  gender: user.gender || null,
  interestedIn: user.interestedIn || 'EVERYONE',
  preferredSports: user.preferredSports
    ? user.preferredSports.split(',').filter(Boolean)
    : [],
  preferredSessionTypes: user.preferredSessionTypes
    ? user.preferredSessionTypes.split(',').filter(Boolean)
    : [],
  bio: user.bio || null,
  photos: user.photos ? JSON.parse(user.photos) : [],
  avgRating: user.avgRating,
  isVerified: user.isVerified,
});

// Optional: Resend OTP endpoint
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Normalize the phone number
    const normalizedPhone = normalizePhone(phone);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete old OTPs
    await prisma.otp.deleteMany({
      where: { phone: normalizedPhone }
    });

    // Save new OTP
    await prisma.otp.create({
      data: {
        phone: normalizedPhone,
        otp,
        expiresAt,
        used: false
      }
    });

    console.log('\n🔄 ==================== RESENT OTP ====================');
    console.log(`📱 Phone : ${normalizedPhone}`);
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