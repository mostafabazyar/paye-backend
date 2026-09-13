import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenUser = (req as any).user;

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // فقط Admin Token می‌تواند وارد Admin API شود
    if (tokenUser.type !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin token required",
      });
    }

    const userId = tokenUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        userId,
      },
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    (req as any).admin = admin;

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify admin access",
    });
  }
};

export default adminMiddleware;