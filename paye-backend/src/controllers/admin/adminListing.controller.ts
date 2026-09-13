import { Request, Response } from "express";
import {
  PrismaClient,
  ExerciseType,
  GenderPreference,
  RequestStatus,
} from "@prisma/client";

import { createAuditLog } from "../../utils/auditLog";
const prisma = new PrismaClient();

/**
 * Parse a positive integer safely.
 */
const parsePositiveInt = (
  value: unknown,
  defaultValue: number
): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return defaultValue;
  }

  return parsed;
};

/**
 * Parse listing ID.
 */
const parseListingId = (value: unknown): number | null => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

/**
 * Parse boolean query params.
 *
 * Supported:
 * true / false
 * 1 / 0
 */
const parseBoolean = (
  value: unknown
): boolean | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true" || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === "0") {
    return false;
  }

  return undefined;
};

/**
 * Normalize tags/sports.
 *
 * Profile.tags is stored as:
 * "football,gym,tennis"
 */
const normalizeTags = (
  value: unknown
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .join(",");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
  }

  return undefined;
};

/**
 * Validate ExerciseType.
 */
const isValidExerciseType = (
  value: unknown
): value is ExerciseType => {
  return (
    value === ExerciseType.ONE_ON_ONE ||
    value === ExerciseType.ONE_ON_MANY ||
    value === ExerciseType.MANY_ON_MANY
  );
};

/**
 * Validate GenderPreference.
 */
const isValidGenderPreference = (
  value: unknown
): value is GenderPreference => {
  return (
    value === GenderPreference.ANY ||
    value === GenderPreference.MEN_ONLY ||
    value === GenderPreference.WOMEN_ONLY
  );
};

/**
 * Format photos safely.
 */
const parsePhotos = (photos: string | null) => {
  if (!photos) {
    return [];
  }

  try {
    const parsed = JSON.parse(photos);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Format creator/user information.
 */
const formatUser = (user: any) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    gender: user.gender,
    birthDate: user.birthDate,
    isVerified: user.isVerified,
    avgRating: user.avgRating,
    photos: parsePhotos(user.photos),
    createdAt: user.createdAt,
  };
};

/**
 * GET /api/admin/listings
 *
 * Get all listings with:
 * - pagination
 * - search
 * - sport filter
 * - exercise type filter
 * - location filter
 * - active/closed filter
 */
export const getAdminListings = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      search,
      sport,
      exerciseType,
      location,
    } = req.query;

    const isActive = parseBoolean(req.query.isActive);

    const page = Math.max(
      parsePositiveInt(req.query.page, 1),
      1
    );

    const requestedLimit = parsePositiveInt(
      req.query.limit,
      20
    );

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      100
    );

    const skip = (page - 1) * limit;

    const where: any = {};

    /**
     * Active / closed filter
     */
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    /**
     * Exercise type filter
     */
    if (
      exerciseType &&
      isValidExerciseType(exerciseType)
    ) {
      where.exerciseType = exerciseType;
    }

    /**
     * Location filter
     */
    if (
      typeof location === "string" &&
      location.trim()
    ) {
      where.location = {
        contains: location.trim(),
      };
    }

    /**
     * Sport filter.
     *
     * Sports are stored inside Profile.tags.
     */
    if (
      typeof sport === "string" &&
      sport.trim()
    ) {
      where.tags = {
        contains: sport.trim().toLowerCase(),
      };
    }

    /**
     * General search.
     *
     * Search across:
     * - title
     * - location
     * - tags
     * - creator name
     * - creator phone
     */
    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchValue = search.trim();

      where.OR = [
        {
          title: {
            contains: searchValue,
          },
        },
        {
          location: {
            contains: searchValue,
          },
        },
        {
          tags: {
            contains: searchValue.toLowerCase(),
          },
        },
        {
          user: {
            name: {
              contains: searchValue,
            },
          },
        },
        {
          user: {
            phone: {
              contains: searchValue,
            },
          },
        },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.profile.findMany({
        where,

        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          user: {
            select: {
              id: true,
              phone: true,
              name: true,
              gender: true,
              birthDate: true,
              isVerified: true,
              avgRating: true,
              photos: true,
              createdAt: true,
            },
          },

          _count: {
            select: {
              requests: true,
            },
          },
        },
      }),

      prisma.profile.count({
        where,
      }),
    ]);

    /**
     * Get APPROVED request count for all returned listings
     * in one query instead of N+1 queries.
     */
    const listingIds = listings.map(
      (listing) => listing.id
    );

    const approvedCounts =
      listingIds.length > 0
        ? await prisma.request.groupBy({
            by: ["profileId"],
            where: {
              profileId: {
                in: listingIds,
              },
              status: RequestStatus.APPROVED,
            },
            _count: {
              _all: true,
            },
          })
        : [];

    const approvedCountMap = new Map<number, number>();

    for (const item of approvedCounts) {
      approvedCountMap.set(
        item.profileId,
        item._count._all
      );
    }

    const formattedListings = listings.map(
      (listing) => {
        const approvedCount =
          approvedCountMap.get(listing.id) || 0;

        return {
          id: listing.id,

          title: listing.title,

          exerciseType: listing.exerciseType,

          genderPreference:
            listing.genderPreference,

          location: listing.location,

          scheduledAt: listing.scheduledAt,

          maxInvites: listing.maxInvites,

          approvedCount,

          remainingCapacity: Math.max(
            listing.maxInvites - approvedCount,
            0
          ),

          requestCount:
            listing._count.requests,

          goDutch: listing.goDutch,

          moreInfo: listing.moreInfo,

          tags: listing.tags
            ? listing.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],

          isActive: listing.isActive,

          createdAt: listing.createdAt,

          updatedAt: listing.updatedAt,

          creator: formatUser(listing.user),
        };
      }
    );

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(total / limit);

    return res.json({
      success: true,

      data: {
        listings: formattedListings,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      },
    });
  } catch (error) {
    console.error(
      "Admin get listings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get listings",
    });
  }
};

/**
 * GET /api/admin/listings/:id
 *
 * Get complete listing details.
 */
export const getAdminListingById = async (
  req: Request,
  res: Response
) => {
  try {
    const listingId = parseListingId(
      req.params.id
    );

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing =
      await prisma.profile.findUnique({
        where: {
          id: listingId,
        },

        include: {
          user: {
            select: {
              id: true,
              phone: true,
              name: true,
              gender: true,
              birthDate: true,
              interestedIn: true,
              preferredSports: true,
              preferredSessionTypes: true,
              bio: true,
              photos: true,
              avgRating: true,
              isVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          requests: {
            orderBy: {
              createdAt: "desc",
            },

            include: {
              requester: {
                select: {
                  id: true,
                  phone: true,
                  name: true,
                  gender: true,
                  birthDate: true,
                  photos: true,
                  avgRating: true,
                  isVerified: true,
                  createdAt: true,
                },
              },

              receiver: {
                select: {
                  id: true,
                  phone: true,
                  name: true,
                  gender: true,
                  birthDate: true,
                  photos: true,
                  avgRating: true,
                  isVerified: true,
                  createdAt: true,
                },
              },
            },
          },

          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const approvedCount =
      await prisma.request.count({
        where: {
          profileId: listing.id,
          status: RequestStatus.APPROVED,
        },
      });

    const pendingCount =
      await prisma.request.count({
        where: {
          profileId: listing.id,
          status: RequestStatus.PENDING,
        },
      });

    const rejectedCount =
      await prisma.request.count({
        where: {
          profileId: listing.id,
          status: RequestStatus.REJECTED,
        },
      });

    const formattedRequests =
      listing.requests.map((request) => ({
        id: request.id,

        status: request.status,

        createdAt: request.createdAt,

        updatedAt: request.updatedAt,

        requester:
          formatUser(request.requester),

        receiver:
          formatUser(request.receiver),
      }));

    return res.json({
      success: true,

      data: {
        listing: {
          id: listing.id,

          title: listing.title,

          exerciseType:
            listing.exerciseType,

          genderPreference:
            listing.genderPreference,

          location: listing.location,

          scheduledAt:
            listing.scheduledAt,

          maxInvites:
            listing.maxInvites,

          isActive:
            listing.isActive,

          goDutch:
            listing.goDutch,

          moreInfo:
            listing.moreInfo,

          tags: listing.tags
            ? listing.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],

          createdAt:
            listing.createdAt,

          updatedAt:
            listing.updatedAt,

          creator:
            formatUser(listing.user),

          capacity: {
            maxInvites:
              listing.maxInvites,

            approved:
              approvedCount,

            remaining:
              Math.max(
                listing.maxInvites -
                  approvedCount,
                0
              ),
          },

          requests: {
            total:
              listing._count.requests,

            pending:
              pendingCount,

            approved:
              approvedCount,

            rejected:
              rejectedCount,

            items:
              formattedRequests,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      "Admin get listing by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get listing details",
    });
  }
};

/**
 * PUT /api/admin/listings/:id
 *
 * Edit listing.
 *
 * Admin can update:
 * - title
 * - exerciseType
 * - genderPreference
 * - location
 * - scheduledAt
 * - maxInvites
 * - goDutch
 * - moreInfo
 * - tags / sports
 * - isActive
 */
export const updateAdminListing = async (
  req: Request,
  res: Response
) => {
  try {
    const listingId = parseListingId(
      req.params.id
    );

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const existingListing =
      await prisma.profile.findUnique({
        where: {
          id: listingId,
        },
      });

    if (!existingListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const {
      title,
      exerciseType,
      genderPreference,
      location,
      scheduledAt,
      maxInvites,
      goDutch,
      moreInfo,
      isActive,
    } = req.body;

    /**
     * Validate exercise type.
     */
    if (
      exerciseType !== undefined &&
      !isValidExerciseType(exerciseType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid exerciseType. Allowed values: ONE_ON_ONE, ONE_ON_MANY, MANY_ON_MANY",
      });
    }

    /**
     * Validate gender preference.
     */
    if (
      genderPreference !== undefined &&
      !isValidGenderPreference(
        genderPreference
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid genderPreference. Allowed values: ANY, MEN_ONLY, WOMEN_ONLY",
      });
    }

    /**
     * Validate title.
     */
    if (
      title !== undefined &&
      (
        typeof title !== "string" ||
        !title.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    /**
     * Validate location.
     */
    if (
      location !== undefined &&
      (
        typeof location !== "string" ||
        !location.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Location cannot be empty",
      });
    }

    /**
     * Validate maxInvites.
     */
    let finalMaxInvites =
      existingListing.maxInvites;

    if (maxInvites !== undefined) {
      const parsedMaxInvites =
        Number(maxInvites);

      if (
        !Number.isInteger(
          parsedMaxInvites
        ) ||
        parsedMaxInvites < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "maxInvites must be an integer greater than or equal to 1",
        });
      }

      finalMaxInvites =
        parsedMaxInvites;
    }

    /**
     * Count approved requests.
     *
     * APPROVED requests consume capacity.
     */
    const approvedCount =
      await prisma.request.count({
        where: {
          profileId: listingId,
          status: RequestStatus.APPROVED,
        },
      });

    /**
     * Never allow admin to reduce capacity
     * below current approved participants.
     */
    if (
      finalMaxInvites < approvedCount
    ) {
      return res.status(409).json({
        success: false,
        message:
          `Cannot set maxInvites to ${finalMaxInvites}. Listing already has ${approvedCount} approved participant(s).`,
        data: {
          approvedCount,
          requestedMaxInvites:
            finalMaxInvites,
        },
      });
    }

    /**
     * Handle scheduledAt.
     *
     * null is allowed because Profile.scheduledAt is nullable.
     */
    let finalScheduledAt =
      existingListing.scheduledAt;

    if (scheduledAt !== undefined) {
      if (
        scheduledAt === null ||
        scheduledAt === ""
      ) {
        finalScheduledAt = null;
      } else {
        const parsedDate =
          new Date(scheduledAt);

        if (
          Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid scheduledAt",
          });
        }

        finalScheduledAt = parsedDate;
      }
    }

    /**
     * Determine final active state.
     */
    let finalIsActive =
      existingListing.isActive;

    if (isActive !== undefined) {
      if (
        typeof isActive !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be a boolean",
        });
      }

      finalIsActive = isActive;
    }

    /**
     * Cannot activate a listing when
     * capacity is already full.
     */
    if (
      finalIsActive &&
      approvedCount >= finalMaxInvites
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Listing cannot be active because approved participant capacity is full",
        data: {
          approvedCount,
          maxInvites:
            finalMaxInvites,
        },
      });
    }

    /**
     * Cannot activate a listing whose
     * scheduled date has already passed.
     */
    if (
      finalIsActive &&
      finalScheduledAt &&
      finalScheduledAt.getTime() <=
        Date.now()
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Listing cannot be active because scheduledAt is in the past",
      });
    }

    /**
     * Prepare update data.
     */
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title =
        title.trim();
    }

    if (
      exerciseType !== undefined
    ) {
      updateData.exerciseType =
        exerciseType;
    }

    if (
      genderPreference !== undefined
    ) {
      updateData.genderPreference =
        genderPreference;
    }

    if (location !== undefined) {
      updateData.location =
        location.trim();
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt =
        finalScheduledAt;
    }

    if (maxInvites !== undefined) {
      updateData.maxInvites =
        finalMaxInvites;
    }

    if (goDutch !== undefined) {
      if (
        typeof goDutch !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "goDutch must be a boolean",
        });
      }

      updateData.goDutch =
        goDutch;
    }

    if (moreInfo !== undefined) {
      if (
        moreInfo !== null &&
        typeof moreInfo !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "moreInfo must be a string or null",
        });
      }

      updateData.moreInfo =
        moreInfo;
    }

    /**
     * Support both:
     *
     * tags: ["football", "gym"]
     *
     * and:
     *
     * sports: ["football", "gym"]
     *
     * Profile stores these in tags.
     */
    const tagsInput =
      req.body.tags !== undefined
        ? req.body.tags
        : req.body.sports;

    if (tagsInput !== undefined) {
      const normalizedTags =
        normalizeTags(tagsInput);

      if (
        normalizedTags === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "tags/sports must be a string or array",
        });
      }

      updateData.tags =
        normalizedTags;
    }

    if (isActive !== undefined) {
      updateData.isActive =
        finalIsActive;
    }

    /**
     * If scheduledAt was changed to a past date,
     * force the listing closed.
     */
    if (
      finalScheduledAt &&
      finalScheduledAt.getTime() <=
        Date.now()
    ) {
      updateData.isActive =
        false;
    }
    

    const updatedListing =
      await prisma.profile.update({
        where: {
          id: listingId,
        },

        data: updateData,

        include: {
          user: {
            select: {
              id: true,
              phone: true,
              name: true,
              gender: true,
              isVerified: true,
              avgRating: true,
              photos: true,
            },
          },
        },
      });
      

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE_LISTING",
      targetType: "LISTING",
      targetId: listingId,
      metadata: {
        changedFields: Object.keys(updateData),
      },
      req,
    });

    return res.json({
      success: true,
      message:
        "Listing updated successfully",

      data: {
        listing: {
          id: updatedListing.id,

          title:
            updatedListing.title,

          exerciseType:
            updatedListing.exerciseType,

          genderPreference:
            updatedListing.genderPreference,

          location:
            updatedListing.location,

          scheduledAt:
            updatedListing.scheduledAt,

          maxInvites:
            updatedListing.maxInvites,

          approvedCount,

          remainingCapacity:
            Math.max(
              updatedListing.maxInvites -
                approvedCount,
              0
            ),

          goDutch:
            updatedListing.goDutch,

          moreInfo:
            updatedListing.moreInfo,

          tags:
            updatedListing.tags
              ? updatedListing.tags
                  .split(",")
                  .map((tag) =>
                    tag.trim()
                  )
                  .filter(Boolean)
              : [],

          isActive:
            updatedListing.isActive,

          createdAt:
            updatedListing.createdAt,

          updatedAt:
            updatedListing.updatedAt,

          creator:
            formatUser(
              updatedListing.user
            ),
        },
      },
    });
  } catch (error) {
    console.error(
      "Admin update listing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update listing",
    });
  }
};

/**
 * PATCH /api/admin/listings/:id/close
 *
 * Close listing.
 */
export const closeAdminListing = async (
  req: Request,
  res: Response
) => {
  try {
    const listingId = parseListingId(
      req.params.id
    );

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing =
      await prisma.profile.findUnique({
        where: {
          id: listingId,
        },
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (!listing.isActive) {
      return res.json({
        success: true,
        message:
          "Listing is already closed",

        data: {
          listing: {
            id: listing.id,
            isActive: false,
          },
        },
      });
    }

    const updatedListing =
      await prisma.profile.update({
        where: {
          id: listingId,
        },

        data: {
          isActive: false,
        },
      });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "CLOSE_LISTING",
      targetType: "LISTING",
      targetId: listingId,
      metadata: {
        title: listing.title,
      },
      req,
    });

    return res.json({
      success: true,

      message:
        "Listing closed successfully",

      data: {
        listing: {
          id: updatedListing.id,
          isActive:
            updatedListing.isActive,
          updatedAt:
            updatedListing.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error(
      "Admin close listing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to close listing",
    });
  }
};

/**
 * PATCH /api/admin/listings/:id/reactivate
 *
 * Reactivate listing.
 *
 * Important rules:
 * - approvedCount must be < maxInvites
 * - scheduledAt cannot be in the past
 */
export const reactivateAdminListing =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const listingId =
        parseListingId(
          req.params.id
        );

      if (!listingId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid listing ID",
        });
      }

      const listing =
        await prisma.profile.findUnique({
          where: {
            id: listingId,
          },
        });

      if (!listing) {
        return res.status(404).json({
          success: false,
          message:
            "Listing not found",
        });
      }

      const approvedCount =
        await prisma.request.count({
          where: {
            profileId: listingId,
            status:
              RequestStatus.APPROVED,
          },
        });

      /**
       * Capacity check.
       */
      if (
        approvedCount >=
        listing.maxInvites
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Listing cannot be reactivated because approved participant capacity is full",

          data: {
            approvedCount,
            maxInvites:
              listing.maxInvites,
          },
        });
      }

      /**
       * Scheduled date check.
       */
      if (
        listing.scheduledAt &&
        listing.scheduledAt.getTime() <=
          Date.now()
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Listing cannot be reactivated because scheduledAt is in the past",

          data: {
            scheduledAt:
              listing.scheduledAt,
          },
        });
      }

      if (listing.isActive) {
        return res.json({
          success: true,

          message:
            "Listing is already active",

          data: {
            listing: {
              id: listing.id,
              isActive: true,
              approvedCount,
              maxInvites:
                listing.maxInvites,
              remainingCapacity:
                listing.maxInvites -
                approvedCount,
            },
          },
        });
      }

      const updatedListing =
        await prisma.profile.update({
          where: {
            id: listingId,
          },

          data: {
            isActive: true,
          },
        });

      const admin = (req as any).admin;

      await createAuditLog({
        adminId: admin.id,
        action: "REACTIVATE_LISTING",
        targetType: "LISTING",
        targetId: listingId,
        metadata: {
          title: listing.title,
        },
        req,
      });

      return res.json({
        success: true,

        message:
          "Listing reactivated successfully",

        data: {
          listing: {
            id: updatedListing.id,

            isActive:
              updatedListing.isActive,

            approvedCount,

            maxInvites:
              updatedListing.maxInvites,

            remainingCapacity:
              updatedListing.maxInvites -
              approvedCount,

            scheduledAt:
              updatedListing.scheduledAt,

            updatedAt:
              updatedListing.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error(
        "Admin reactivate listing error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reactivate listing",
      });
    }
  };

/**
 * DELETE /api/admin/listings/:id
 *
 * Delete listing.
 *
 * Because Profile -> Request uses onDelete: Cascade,
 * related requests are deleted automatically.
 */
export const deleteAdminListing = async (
  req: Request,
  res: Response
) => {
  try {
    const listingId = parseListingId(
      req.params.id
    );

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID",
      });
    }

    const listing =
      await prisma.profile.findUnique({
        where: {
          id: listingId,
        },

        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    await prisma.profile.delete({
      where: {
        id: listingId,
      },
    });

    const admin = (req as any).admin;

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE_LISTING",
      targetType: "LISTING",
      targetId: listingId,
      metadata: {
        title: listing.title,
        requestCount: listing._count.requests,
      },
      req,
    });

    return res.json({
      success: true,

      message:
        "Listing deleted successfully",

      data: {
        deletedListingId:
          listingId,

        deletedRequestCount:
          listing._count.requests,
      },
    });
  } catch (error) {
    console.error(
      "Admin delete listing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete listing",
    });
  }
};