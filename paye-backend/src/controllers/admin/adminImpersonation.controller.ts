import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

export const impersonateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = String(req.params.userId);

    const admin = (req as any).admin;

    if (!admin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        admin: true,
      },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Admin نمی‌تواند Admin دیگری را impersonate کند
    if (targetUser.admin) {
      res.status(403).json({
        success: false,
        message: "Cannot impersonate an admin user",
      });
      return;
    }

    // User بلاک‌شده قابل impersonate نیست
    if (targetUser.isBlocked) {
      res.status(403).json({
        success: false,
        message: "Cannot impersonate a blocked user",
      });
      return;
    }

    const token = jwt.sign(
      {
        id: targetUser.id,
        phone: targetUser.phone,
        type: "IMPERSONATION",
        impersonatedBy: admin.id,
      },
      JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );

    await createAuditLog({
      adminId: admin.id,
      action: "IMPERSONATE_USER",
      targetType: "USER",
      targetId: targetUser.id,
      metadata: {
        expiresIn: "30m",
      },
      req,
    });

    res.json({
      success: true,
      message: "Impersonation started",
      token,
      expiresIn: "30m",
      user: {
        id: targetUser.id,
        phone: targetUser.phone,
        name: targetUser.name,
        isVerified: targetUser.isVerified,
      },
      impersonation: {
        active: true,
        impersonatedBy: admin.id,
      },
    });
  } catch (error) {
    console.error("Impersonation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to impersonate user",
    });
  }
};