const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const OTPService = require('../services/otpService');

const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { phone } });
    
    // Request OTP
    const result = await OTPService.requestOTP(phone);
    
    res.json({ 
      success: true, 
      message: result.message,
      isNewUser: !user
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    // Verify OTP
    const verification = await OTPService.verifyOTP(phone, otp);
    
    if (!verification.success) {
      return res.status(400).json({ error: verification.message });
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          isVerified: true
        }
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

module.exports = { requestOTP, verifyOTP };