import { Request, Response } from "express";
import { PrismaClient, InterestedIn } from "@prisma/client";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

const parsePhotos = (photos: any): string[] => {
  if (!photos) return [];

  if (Array.isArray(photos)) {
    return photos;
  }

  try {
    const parsed = JSON.parse(String(photos));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatUserResponse = (user: any) => {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name || null,
    birthDate: user.birthDate || null,
    gender: user.gender || null,
    interestedIn: user.interestedIn || null,
    preferredSports: user.preferredSports || null,
    preferredSessionTypes: user.preferredSessionTypes || null,
    bio: user.bio || null,
    photos: parsePhotos(user.photos),
    avgRating: user.avgRating,
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
    isAdmin: !!user.admin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * GET /api/admin/users
 */
export const getAdminUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search = "",
      isVerified,
      isBlocked,
      skip = "0",
      take = "20",
    } = req.query;

    const parsedSkip = Math.max(
      parseInt(String(skip), 10) || 0,
      0
    );

    const parsedTake = Math.min(
      Math.max(parseInt(String(take), 10) || 20, 1),
      100
    );

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: String(search),
          },
        },
        {
          phone: {
            contains: String(search),
          },
        },
      ];
    }

    if (isVerified === "true") {
      where.isVerified = true;
    }

    if (isVerified === "false") {
      where.isVerified = false;
    }

    if (isBlocked === "true") {
      where.isBlocked = true;
    }

    if (isBlocked === "false") {
      where.isBlocked = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parsedSkip,
        take: parsedTake,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          admin: true,
        },
      }),

      prisma.user.count({
        where,
      }),
    ]);

    res.json({
      success: true,
      users: users.map(formatUserResponse),
      total,
      skip: parsedSkip,
      take: parsedTake,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * GET /api/admin/users/:id
 */
export const getAdminUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        admin: true,

        profiles: {
          orderBy: {
            createdAt: "desc",
          },
        },

        sentRequests: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            profile: true,
            receiver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },

        receivedRequests: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            profile: true,
            requester: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      user: formatUserResponse(user),
      listings: user.profiles,
      sentRequests: user.sentRequests,
      receivedRequests: user.receivedRequests,
    });
  } catch (error) {
    console.error("Admin get user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

/**
 * PUT /api/admin/users/:id
 *
 * Admin can edit profile information.
 * Sensitive fields like phone, rating, verification
 * and block status are intentionally excluded.
 */
export const updateAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const {
      name,
      birthDate,
      gender,
      interestedIn,
      preferredSports,
      preferredSessionTypes,
      bio,
      photos,
    } = req.body;

    const data: any = {};

    if (name !== undefined) {
      data.name = name === null ? null : String(name);
    }

    if (birthDate !== undefined) {
      if (birthDate === null || birthDate === "") {
        data.birthDate = null;
      } else {
        const parsedDate = new Date(birthDate);

        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid birthDate",
          });
          return;
        }

        data.birthDate = parsedDate;
      }
    }

    if (gender !== undefined) {
      data.gender = gender === null ? null : String(gender);
    }

    if (interestedIn !== undefined) {
      if (
        interestedIn !== null &&
        !Object.values(InterestedIn).includes(interestedIn)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid interestedIn value",
        });
        return;
      }

      data.interestedIn = interestedIn;
    }

    if (preferredSports !== undefined) {
      data.preferredSports =
        preferredSports === null
          ? null
          : String(preferredSports);
    }

    if (preferredSessionTypes !== undefined) {
      data.preferredSessionTypes =
        preferredSessionTypes === null
          ? null
          : String(preferredSessionTypes);
    }

    if (bio !== undefined) {
      data.bio = bio === null ? null : String(bio);
    }

    if (photos !== undefined) {
      const parsedPhotos = parsePhotos(photos);
      data.photos = JSON.stringify(parsedPhotos);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: {
        admin: true,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Admin update user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
export const deleteAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
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

    // Don't allow deleting an admin account.
    if (user.admin) {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete an admin user. Remove admin access first.",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Message relation doesn't have cascade delete.
      await tx.message.deleteMany({
        where: {
          senderId: id,
        },
      });

      // Profiles and Requests will be removed through
      // the cascade relations defined in Prisma schema.
      await tx.user.delete({
        where: {
          id,
        },
      });
    });

    const admin = (req as any).admin;
    await createAuditLog({
      adminId: admin.id,
      action: "DELETE_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/block
 */
export const blockAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
      },
      include: {
        admin: true,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "BLOCK_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User blocked successfully",
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Admin block user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to block user",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/unblock
 */
export const unblockAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
      },
      include: {
        admin: true,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "UNBLOCK_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User unblocked successfully",
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Admin unblock user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/verify
 */
export const verifyAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
      },
      include: {
        admin: true,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "VERIFY_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User verified successfully",
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Admin verify user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify user",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/unverify
 */
export const unverifyAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isVerified: false,
      },
      include: {
        admin: true,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "UNVERIFY_USER",
      targetType: "USER",
      targetId: id,
      req,
    });

    res.json({
      success: true,
      message: "User unverified successfully",
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Admin unverify user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to unverify user",
    });
  }
};