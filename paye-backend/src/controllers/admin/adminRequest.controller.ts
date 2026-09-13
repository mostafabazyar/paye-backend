import { Request, Response } from "express";
import { PrismaClient, RequestStatus } from "@prisma/client";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

const parseId = (value: unknown): number | null => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

/**
 * GET /api/admin/requests
 *
 * Query:
 * search
 * status
 * profileId
 * skip
 * take
 */
export const getAdminRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search = "",
      status,
      profileId,
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

    // Filter by status
    if (
      status &&
      Object.values(RequestStatus).includes(
        String(status) as RequestStatus
      )
    ) {
      where.status = String(status);
    }

    // Filter by profile/listing
    if (profileId !== undefined) {
      const parsedProfileId = parseId(profileId);

      if (!parsedProfileId) {
        res.status(400).json({
          success: false,
          message: "Invalid profileId",
        });
        return;
      }

      where.profileId = parsedProfileId;
    }

    // Search requester / receiver / listing
    if (search) {
      const searchValue = String(search);

      where.OR = [
        {
          requester: {
            name: {
              contains: searchValue,
            },
          },
        },
        {
          requester: {
            phone: {
              contains: searchValue,
            },
          },
        },
        {
          receiver: {
            name: {
              contains: searchValue,
            },
          },
        },
        {
          receiver: {
            phone: {
              contains: searchValue,
            },
          },
        },
        {
          profile: {
            title: {
              contains: searchValue,
            },
          },
        },
        {
          profile: {
            location: {
              contains: searchValue,
            },
          },
        },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip: parsedSkip,
        take: parsedTake,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          profile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },

          requester: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVerified: true,
              isBlocked: true,
            },
          },

          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVerified: true,
              isBlocked: true,
            },
          },
        },
      }),

      prisma.request.count({
        where,
      }),
    ]);

    res.json({
      success: true,
      requests,
      total,
      skip: parsedSkip,
      take: parsedTake,
    });
  } catch (error) {
    console.error("Admin get requests error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
    });
  }
};

/**
 * GET /api/admin/requests/:id
 */
export const getAdminRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
      return;
    }

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },

      include: {
        profile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                isVerified: true,
                isBlocked: true,
              },
            },
          },
        },

        requester: {
          select: {
            id: true,
            name: true,
            phone: true,
            gender: true,
            interestedIn: true,
            bio: true,
            photos: true,
            avgRating: true,
            isVerified: true,
            isBlocked: true,
            createdAt: true,
          },
        },

        receiver: {
          select: {
            id: true,
            name: true,
            phone: true,
            gender: true,
            interestedIn: true,
            bio: true,
            photos: true,
            avgRating: true,
            isVerified: true,
            isBlocked: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
      return;
    }

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Admin get request error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch request",
    });
  }
};

/**
 * Approve request
 *
 * Same capacity rules as the normal user flow:
 * - event must be active
 * - approved requests cannot exceed maxInvites
 * - profile is closed when capacity is reached
 */
export const approveAdminRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
      return;
    }

    const updatedRequest = await prisma.$transaction(
      async (tx) => {
        const request = await tx.request.findUnique({
          where: {
            id: requestId,
          },
          include: {
            profile: true,
          },
        });

        if (!request) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        if (request.status === "APPROVED") {
          return tx.request.findUnique({
            where: {
              id: requestId,
            },
            include: {
              profile: true,
              requester: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  isVerified: true,
                  isBlocked: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  isVerified: true,
                  isBlocked: true,
                },
              },
            },
          });
        }

        // Lock profile row to prevent simultaneous approvals
        await tx.$queryRaw`
          SELECT id
          FROM Profile
          WHERE id = ${request.profileId}
          FOR UPDATE
        `;

        const profile = await tx.profile.findUnique({
          where: {
            id: request.profileId,
          },
        });

        if (!profile) {
          throw new Error("PROFILE_NOT_FOUND");
        }

        if (!profile.isActive) {
          throw new Error("EVENT_CLOSED");
        }

        const approvedCount = await tx.request.count({
          where: {
            profileId: request.profileId,
            status: "APPROVED",
          },
        });

        if (approvedCount >= profile.maxInvites) {
          await tx.profile.update({
            where: {
              id: request.profileId,
            },
            data: {
              isActive: false,
            },
          });

          throw new Error("EVENT_FULL");
        }

        const updated = await tx.request.update({
          where: {
            id: requestId,
          },
          data: {
            status: "APPROVED",
          },

          include: {
            profile: true,

            requester: {
              select: {
                id: true,
                name: true,
                phone: true,
                isVerified: true,
                isBlocked: true,
              },
            },

            receiver: {
              select: {
                id: true,
                name: true,
                phone: true,
                isVerified: true,
                isBlocked: true,
              },
            },
          },
        });

        // Close listing when capacity is reached
        if (approvedCount + 1 >= profile.maxInvites) {
          await tx.profile.update({
            where: {
              id: request.profileId,
            },
            data: {
              isActive: false,
            },
          });
        }

        return updated;
      }
    );

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "APPROVE_REQUEST",
      targetType: "REQUEST",
      targetId: requestId,
      metadata: {
        profileId: updatedRequest?.profileId,
      },
      req,
    });

    res.json({
      success: true,
      message: "Request approved successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Admin approve request error:", error);

    if (error instanceof Error) {
      if (error.message === "REQUEST_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Request not found",
        });
        return;
      }

      if (error.message === "PROFILE_NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Profile not found",
        });
        return;
      }

      if (error.message === "EVENT_CLOSED") {
        res.status(400).json({
          success: false,
          message: "This event is no longer active",
        });
        return;
      }

      if (error.message === "EVENT_FULL") {
        res.status(400).json({
          success: false,
          message: "This event is full",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to approve request",
    });
  }
};

/**
 * Reject request
 */
export const rejectAdminRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
      return;
    }

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
      return;
    }

    const updatedRequest = await prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        status: "REJECTED",
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
        receiver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "REJECT_REQUEST",
      targetType: "REQUEST",
      targetId: requestId,
      metadata: {
        previousStatus: request.status,
      },
      req,
    });

    res.json({
      success: true,
      message: "Request rejected successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Admin reject request error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject request",
    });
  }
};

/**
 * Set request back to PENDING
 */
export const pendingAdminRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
      return;
    }

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
      return;
    }

    // If an approved request is changed to pending,
    // the listing may become available again.
    const updatedRequest = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.request.update({
          where: {
            id: requestId,
          },
          data: {
            status: "PENDING",
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
            receiver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        });

        if (request.status === "APPROVED") {
          const profile = await tx.profile.findUnique({
            where: {
              id: request.profileId,
            },
          });

          if (profile && !profile.isActive) {
            const approvedCount = await tx.request.count({
              where: {
                profileId: request.profileId,
                status: "APPROVED",
              },
            });

            if (
              approvedCount < profile.maxInvites &&
              (!profile.scheduledAt ||
                profile.scheduledAt > new Date())
            ) {
              await tx.profile.update({
                where: {
                  id: request.profileId,
                },
                data: {
                  isActive: true,
                },
              });
            }
          }
        }

        return updated;
      }
    );

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "PENDING_REQUEST",
      targetType: "REQUEST",
      targetId: requestId,
      metadata: {
        previousStatus: request.status,
      },
      req,
    });

    res.json({
      success: true,
      message: "Request moved to pending successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Admin pending request error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to move request to pending",
    });
  }
};

/**
 * DELETE /api/admin/requests/:id
 */
export const deleteAdminRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id);

    if (!requestId) {
      res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
      return;
    }

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Request not found",
      });
      return;
    }

    await prisma.request.delete({
      where: {
        id: requestId,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE_REQUEST",
      targetType: "REQUEST",
      targetId: requestId,
      metadata: {
        profileId: request.profileId,
        requesterId: request.requesterId,
        receiverId: request.receiverId,
        previousStatus: request.status,
      },
      req,
    });

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete request error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete request",
    });
  }
};