import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const normalizePhone = (phone: string): string => {
  let normalized = phone.trim().replace(/\s+/g, "");

  if (normalized.startsWith("+98")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("98")) {
    normalized = "0" + normalized.slice(2);
  }

  return normalized;
};

export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
      include: {
        admin: true,
      },
    });

    if (!user || !user.admin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.updateMany({
      where: {
        phone: normalizedPhone,
        used: false,
      },
      data: {
        used: true,
      },
    });

    await prisma.otp.create({
      data: {
        phone: normalizedPhone,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const admin = user.admin;

    if (admin) {
      await createAuditLog({
        adminId: admin.id,
        action: "ADMIN_LOGIN",
        targetType: "ADMIN",
        targetId: admin.id,
        req,
      });
    }

    res.json({
      success: true,
      message: "Admin OTP sent successfully",
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send admin OTP",
    });
  }
};

export const adminVerifyOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone: normalizedPhone,
        otp: otp.toString(),
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
      include: {
        admin: true,
      },
    });

    if (!user || !user.admin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    await prisma.otp.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        used: true,
      },
    });

    // Admin JWT
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        type: "ADMIN",
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Admin verify OTP error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify admin OTP",
    });
  }
};

export const adminMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        isVerified: true,
        admin: true,
      },
    });

    if (!user || !user.admin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Admin me error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin profile",
    });
  }
};