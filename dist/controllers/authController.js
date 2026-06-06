"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.requestOTP = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otpService_1 = __importDefault(require("../services/otpService"));
const prisma = new client_1.PrismaClient();
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const requestOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            res.status(400).json({ error: 'Phone number is required' });
            return;
        }
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { phone } });
        // Request OTP
        const result = await otpService_1.default.requestOTP(phone);
        res.json({
            success: true,
            message: result.message,
            isNewUser: !user
        });
    }
    catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
exports.requestOTP = requestOTP;
const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            res.status(400).json({ success: false, error: 'Phone and OTP are required' });
            return;
        }
        // Verify OTP
        const verification = await otpService_1.default.verifyOTP(phone, otp);
        if (!verification.success) {
            res.status(400).json({ success: false, error: verification.message });
            return;
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
        }
        else if (!user.isVerified) {
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
    }
    catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify OTP' });
    }
};
exports.verifyOTP = verifyOTP;
