// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const genderMap: Record<string, string> = {
  'FEMALE': 'WOMEN_ONLY',
  'MALE': 'MEN_ONLY'
};

const parseDateOrNull = (value?: unknown) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPastDate = (value?: Date | string | null) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};

/**
 * Parse birth date from frontend.
 *
 * Expected:
 * YYYY-MM-DD
 *
 * Example:
 * 1999-08-16
 */
const parseBirthDate = (value?: unknown): Date | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  // Prevent invalid dates like 1999-02-31
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

/**
 * Calculate age from birth date.
 */
const calculateAge = (birthDate?: Date | null): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);

  let age =
    today.getUTCFullYear() -
    birth.getUTCFullYear();

  const currentMonth = today.getUTCMonth();
  const birthMonth = birth.getUTCMonth();

  const currentDay = today.getUTCDate();
  const birthDay = birth.getUTCDate();

  if (
    currentMonth < birthMonth ||
    (
      currentMonth === birthMonth &&
      currentDay < birthDay
    )
  ) {
    age--;
  }

  return age;
};

/**
 * Format birth date as YYYY-MM-DD.
 */
const formatBirthDate = (birthDate?: Date | null): string | null => {
  if (!birthDate) {
    return null;
  }

  const date = new Date(birthDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Helper to format user response
const formatUserResponse = (user: any) => {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name || null,

    // Exact birth date
    birthDate: formatBirthDate(user.birthDate),

    // Calculated age
    age: calculateAge(user.birthDate),

    gender: user.gender || null,
    interestedIn: user.interestedIn || 'EVERYONE',
    preferredSports: user.preferredSports ? user.preferredSports.split(',').filter(Boolean) : [],
    preferredSessionTypes: user.preferredSessionTypes ? user.preferredSessionTypes.split(',').filter(Boolean) : [],
    bio: user.bio || null,
    photos: user.photos ? JSON.parse(user.photos) : [],
    avgRating: user.avgRating,
    isVerified: user.isVerified,
  };
};

export const setupProfile = async (req: Request, res: Response) => {
  try {
    const { name, birthDate, gender, interestedIn, preferredSports, preferredSessionTypes, bio } = req.body;
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    /**
     * Parse birth date.
     *
     * Frontend sends:
     * "1999-08-16"
     */
    const parsedBirthDate = parseBirthDate(birthDate);

    if (!parsedBirthDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid birth date. Expected format YYYY-MM-DD'
      });
    }

    /**
     * Birth date cannot be in the future.
     */
    if (parsedBirthDate.getTime() > Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Birth date cannot be in the future'
      });
    }

    /**
     * Calculate age.
     */
    const age = calculateAge(parsedBirthDate);

    if (age === null) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate age'
      });
    }

    /**
     * Validate age.
     */
    if (age < 16) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 16 years old'
      });
    }

    if (age > 70) {
      return res.status(400).json({
        success: false,
        message: 'Age cannot be greater than 70'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,

        // IMPORTANT:
        // Do NOT use parseInt here.
        birthDate: parsedBirthDate,

        gender,
        interestedIn,
        preferredSports: Array.isArray(preferredSports) ? preferredSports.join(',') : null,
        preferredSessionTypes: Array.isArray(preferredSessionTypes) ? preferredSessionTypes.join(',') : null,
        bio,
        isVerified: true,
      },
    });

    console.log(`✅ Profile setup completed for user: ${userId}`);

    // Generate a new token with updated data
    const token = jwt.sign(
      { id: updatedUser.id, phone: updatedUser.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Profile setup completed successfully',
      user: formatUserResponse(updatedUser),
      token,
    });
  } catch (error: any) {
    console.error('Setup profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: formatUserResponse(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// Create a new profile/listing for the current user
export const createProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const {
      sports,
      exerciseType,
      genderPreference,
      title,
      location,
      scheduledAt,
      maxInvites = 1,
      goDutch = false,
      moreInfo,
      tags,
    } = req.body;
    const parsedScheduledAt = parseDateOrNull(scheduledAt);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (scheduledAt && !parsedScheduledAt) {
      return res.status(400).json({ success: false, message: 'Invalid schedule time' });
    }

    // Map sports array to tags string if provided
    const preference = genderMap[genderPreference] || genderPreference || 'ANY';

    const tagsString = Array.isArray(sports)
      ? sports.map((sport: string) => sport.trim().toLowerCase()).join(',')
      : String(tags || '').toLowerCase();

    const profile = await prisma.profile.create({
      data: {
        userId,
        exerciseType: exerciseType || 'ONE_ON_ONE',
        genderPreference: preference,
        title,
        location,
        scheduledAt: parsedScheduledAt,
        maxInvites: Number(maxInvites) || 1,
        goDutch: !!goDutch,
        moreInfo: moreInfo || null,
        tags: tagsString,
        isActive: !isPastDate(parsedScheduledAt),
      },
    });

    res.status(201).json({ success: true, profile });
  } catch (error) {
    console.error('Create profile listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to create profile listing' });
  }
};

// Explore profile listings, optional filter by sport via query param
export const exploreListings = async (req: Request, res: Response) => {
  try {
    const {
      sport,
      skip = '0',
      take = '20',
      exerciseType,
      genderPreference,
      location,
      sortBy = 'newest'
    } = req.query as any;

    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Automatically close listings whose scheduled time has passed.
    await prisma.profile.updateMany({
      where: {
        isActive: true,
        scheduledAt: {
          lte: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });

    const where: any = {
      isActive: true,
        userId: {
        not: userId,
      },
    };

    if (sport) {
      where.tags = {
        contains: String(sport).toLowerCase(),
      };
    }

    if (exerciseType) {
      where.exerciseType = exerciseType;
    }

    if (genderPreference) {
      where.genderPreference = genderPreference;
    }

    if (location) {
      where.location = {
        contains: String(location).toLowerCase(),
      };
    }

    const orderBy =
      sortBy === 'soonest'
        ? [
            { scheduledAt: 'asc' as const },
            { createdAt: 'desc' as const },
          ]
        : sortBy === 'oldest'
          ? { createdAt: 'asc' as const }
          : { createdAt: 'desc' as const };

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            birthDate: true,
            photos: true,
            avgRating: true,
          },
        },
        requests: {
          where: {
            requesterId: userId,
          },
          select: {
            status: true,
          },
        },
      },
      skip: parseInt(skip, 10),
      take: parseInt(take, 10),
      orderBy,
    });

    const formatted = profiles.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      exerciseType: p.exerciseType,
      genderPreference: p.genderPreference,
      tags: p.tags
        ? p.tags.split(',').filter(Boolean)
        : [],
      maxInvites: p.maxInvites,
      goDutch: p.goDutch,
      moreInfo: p.moreInfo,
      scheduledAt: p.scheduledAt,
      isActive: p.isActive,
      createdAt: p.createdAt,

      // Current user's request status for this listing
      requestStatus: p.requests[0]?.status || null,

      user: formatUserResponse(p.user),
    }));

    return res.json({
      success: true,
      profiles: formatted,
    });
  } catch (error) {
    console.error('Explore listings error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to explore listings'
    });
  }
};


export const myCreatedProfileListing = async (req: Request, res: Response) => {
  try {
    // Extract authenticated user ID from middleware
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch all profiles created by this specific user
    const profiles = await prisma.profile.findMany({
      where: {
        userId: userId,
      },
      include: {
        // Includes the total request count to see how many people want to join
        _count: {
          select: { requests: true }
        }
      },
      orderBy: {
        createdAt: 'desc', // Show newest listings first
      },
    });

    // Format the response and inject ownership flags
    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      title: profile.title,
      location: profile.location,
      exerciseType: profile.exerciseType,
      genderPreference: profile.genderPreference,
      tags: profile.tags ? profile.tags.split(',') : [],
      maxInvites: profile.maxInvites,
      goDutch: profile.goDutch,
      moreInfo: profile.moreInfo,
      scheduledAt: profile.scheduledAt,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      totalRequests: profile._count.requests,
      // Frontend security flag: True because this route only returns the user's own data
      isOwner: true,
    }));

    return res.json({
      success: true,
      profiles: formattedProfiles,
    });
  } catch (error) {
    console.error('Fetch user profiles error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your listings' });
  }
};

// Edit an existing profile listing owned by the current user
export const editCreatedProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { id } = req.params;

    const {
      sports,
      exerciseType,
      genderPreference,
      title,
      location,
      scheduledAt,
      maxInvites,
      goDutch,
      moreInfo,
      tags,
      isActive,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const profileId = parseInt(id as string, 10);

    if (Number.isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile ID format'
      });
    }

    // Verify ownership
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or you do not have permission to edit it.'
      });
    }

    // Validate exercise type against Prisma enum
    const validExerciseTypes = [
      'ONE_ON_ONE',
      'ONE_ON_MANY',
      'MANY_ON_MANY',
    ];

    if (
      exerciseType !== undefined &&
      !validExerciseTypes.includes(exerciseType)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exercise type'
      });
    }

    // Validate gender preference
    const validGenderPreferences = [
      'ANY',
      'MEN_ONLY',
      'WOMEN_ONLY',
    ];

    const mappedGenderPreference =
      genderPreference !== undefined
        ? genderMap[genderPreference] || genderPreference
        : undefined;

    if (
      mappedGenderPreference !== undefined &&
      !validGenderPreferences.includes(mappedGenderPreference)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender preference'
      });
    }

    // Parse scheduled date
    let parsedScheduledAt = existingProfile.scheduledAt;
    let computedIsActive = existingProfile.isActive;

    if (scheduledAt !== undefined) {
      const parsed = parseDateOrNull(scheduledAt);

      if (scheduledAt && !parsed) {
        return res.status(400).json({
          success: false,
          message: 'Invalid schedule time'
        });
      }

      parsedScheduledAt = parsed;
      computedIsActive = !isPastDate(parsed);
    }

    // Convert sports/tags to the database tags string
    let tagsString = existingProfile.tags;

    if (sports !== undefined) {
      tagsString = Array.isArray(sports)
        ? sports
            .map((sport: string) => sport.trim().toLowerCase())
            .filter(Boolean)
            .join(',')
        : String(sports || '').toLowerCase();
    } else if (tags !== undefined) {
      tagsString = Array.isArray(tags)
        ? tags
            .map((tag: string) => tag.trim().toLowerCase())
            .filter(Boolean)
            .join(',')
        : String(tags || '').toLowerCase();
    }

    // Validate maxInvites
    let parsedMaxInvites = existingProfile.maxInvites;

    if (maxInvites !== undefined) {
      parsedMaxInvites = Number(maxInvites);

      if (
        !Number.isInteger(parsedMaxInvites) ||
        parsedMaxInvites < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'maxInvites must be at least 1'
        });
      }
    }

    /*
     * Never allow a listing that is already full to be reopened
     * by simply sending isActive: true.
     */
    const approvedCount = await prisma.request.count({
      where: {
        profileId,
        status: 'APPROVED',
      },
    });

    const finalMaxInvites =
      parsedMaxInvites ?? existingProfile.maxInvites;

    if (approvedCount >= finalMaxInvites) {
      computedIsActive = false;
    } else if (isActive !== undefined) {
      computedIsActive = !!isActive;
    }

    // A past scheduled time must always remain inactive.
    if (isPastDate(parsedScheduledAt)) {
      computedIsActive = false;
    }

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = String(title).trim();
    }

    if (location !== undefined) {
      updateData.location = String(location).trim();
    }

    if (exerciseType !== undefined) {
      updateData.exerciseType = exerciseType;
    }

    if (mappedGenderPreference !== undefined) {
      updateData.genderPreference = mappedGenderPreference;
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = parsedScheduledAt;
    }

    if (maxInvites !== undefined) {
      updateData.maxInvites = parsedMaxInvites;
    }

    if (goDutch !== undefined) {
      updateData.goDutch = !!goDutch;
    }

    if (moreInfo !== undefined) {
      updateData.moreInfo = moreInfo
        ? String(moreInfo).trim()
        : null;
    }

    if (sports !== undefined || tags !== undefined) {
      updateData.tags = tagsString;
    }

    // Always write the calculated active state.
    updateData.isActive = computedIsActive;

    const updatedProfile = await prisma.profile.update({
      where: {
        id: existingProfile.id,
      },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      profile: {
        ...updatedProfile,
        tags: updatedProfile.tags
          ? updatedProfile.tags.split(',').filter(Boolean)
          : [],
      },
    });
  } catch (error) {
    console.error('Edit profile listing error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile listing',
      error: error instanceof Error
        ? error.message
        : String(error)
    });
  }
};