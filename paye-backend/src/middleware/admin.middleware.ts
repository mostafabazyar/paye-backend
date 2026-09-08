import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
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
        message: 'Admin access required',
      });
    }

    (req as any).admin = admin;

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin access',
    });
  }
};

export default adminMiddleware;