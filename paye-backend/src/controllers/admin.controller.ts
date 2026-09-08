import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalListings,
      activeListings,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.profile.count(),

      prisma.profile.count({
        where: {
          isActive: true,
        },
      }),

      prisma.request.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.request.count({
        where: {
          status: "APPROVED",
        },
      }),

      prisma.request.count({
        where: {
          status: "REJECTED",
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
        },

        listings: {
          total: totalListings,
          active: activeListings,
        },

        requests: {
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};