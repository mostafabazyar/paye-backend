import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

/**
 * GET /api/admin/admins
 *
 * Get all admins
 */
export const getAdmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            isVerified: true,
            isBlocked: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admins",
    });
  }
};

/**
 * GET /api/admin/admins/:id
 *
 * Get one admin by User ID
 */
export const getAdminById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Admin user ID is required",
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: {
        userId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            birthDate: true,
            gender: true,
            interestedIn: true,
            preferredSports: true,
            preferredSessionTypes: true,
            bio: true,
            photos: true,
            avgRating: true,
            isVerified: true,
            isBlocked: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin",
    });
  }
};

/**
 * POST /api/admin/admins
 *
 * Create admin access for an existing user
 *
 * Body:
 * {
 *   "userId": "..."
 * }
 */
export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    // Check target user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        admin: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Already admin
    if (user.admin) {
      res.status(409).json({
        success: false,
        message: "User is already an admin",
      });
      return;
    }

    // Blocked users cannot become admins
    if (user.isBlocked) {
      res.status(400).json({
        success: false,
        message: "Blocked users cannot be made admins",
      });
      return;
    }

    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            isVerified: true,
            isBlocked: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const currentAdmin = (req as any).admin;

    if (currentAdmin) {
      await createAuditLog({
        adminId: currentAdmin.id,
        action: "CREATE_ADMIN",
        targetType: "ADMIN",
        targetId: admin.id,
        metadata: {
          userId: user.id,
        },
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    console.error("Create admin error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
};

/**
 * DELETE /api/admin/admins/:id
 *
 * Remove admin access from a user
 */
export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Admin user ID is required",
      });
      return;
    }

    const currentAdmin = (req as any).admin;

    if (!currentAdmin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    // Prevent admin from removing themselves
    if (currentAdmin.userId === id) {
      res.status(400).json({
        success: false,
        message: "You cannot remove your own admin access",
      });
      return;
    }

    const targetAdmin = await prisma.admin.findUnique({
      where: {
        userId: id,
      },
    });

    if (!targetAdmin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    // Never allow the system to have zero admins
    const adminCount = await prisma.admin.count();

    if (adminCount <= 1) {
      res.status(400).json({
        success: false,
        message: "Cannot remove the last admin",
      });
      return;
    }

    await prisma.admin.delete({
      where: {
        userId: id,
      },
    });

    await createAuditLog({
      adminId: currentAdmin.id,
      action: "DELETE_ADMIN",
      targetType: "ADMIN",
      targetId: targetAdmin.id,
      metadata: {
        userId: id,
      },
      req,
    });

    res.json({
      success: true,
      message: "Admin access removed successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove admin access",
    });
  }
};