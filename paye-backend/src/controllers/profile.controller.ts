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

// Helper to format user response
const formatUserResponse = (user: any) => {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name || null,
    age: user.age || null,
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
    const { name, age, gender, interestedIn, preferredSports, preferredSessionTypes, bio } = req.body;
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        age: typeof age === 'string' ? parseInt(age) : age,
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
    const { sport, skip = '0', take = '20', exerciseType, genderPreference, location, sortBy = 'newest' } = req.query as any;

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

    const where: any = { isActive: true };

    if (sport) {
      where.tags = { contains: String(sport).toLowerCase() };
    }

    if (exerciseType) {
      where.exerciseType = exerciseType;
    }

    if (genderPreference) {
      where.genderPreference = genderPreference;
    }

    if (location) {
      where.location = { contains: String(location).toLowerCase() };
    }

    const orderBy =
      sortBy === 'soonest'
        ? [{ scheduledAt: 'asc' as const }, { createdAt: 'desc' as const }]
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
            photos: true,
            avgRating: true,
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(take),
      orderBy,
    });

    const formatted = profiles.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      exerciseType: p.exerciseType,
      genderPreference: p.genderPreference,
      tags: p.tags ? p.tags.split(',') : [],
      maxInvites: p.maxInvites,
      goDutch: p.goDutch,
      moreInfo: p.moreInfo,
      scheduledAt: p.scheduledAt,
      createdAt: p.createdAt,
      user: formatUserResponse(p.user),
    }));

    res.json({ success: true, profiles: formatted });
  } catch (error) {
    console.error('Explore listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to explore listings' });
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
// Edit an existing profile listing owned by the current user
export const editCreatedProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { id } = req.params; // Get profile ID from url parameter
    
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
      isActive
    } = req.body;

    console.log('🔧 Edit request details:', { 
      userId, 
      profileId: id, 
      body: req.body 
    });

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Convert id to number (since your schema uses Int for id)
    const profileId = parseInt(id as string);
    if (isNaN(profileId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid profile ID format' 
      });
    }

    console.log('📝 Looking for profile with id:', profileId);

    // 1. Verify that the listing exists and belongs to the requesting user
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: profileId, // Now this is definitely a number
        userId: userId
      }
    });

    console.log('🔍 Found profile:', existingProfile);

    if (!existingProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found or you do not have permission to edit it.' 
      });
    }

    // 2. Parse date options if they are being updated
    let parsedScheduledAt = existingProfile.scheduledAt;
    let computedIsActive = existingProfile.isActive;

    if (scheduledAt !== undefined) {
      const parsed = parseDateOrNull(scheduledAt);
      if (scheduledAt && !parsed) {
        return res.status(400).json({ success: false, message: 'Invalid schedule time' });
      }
      parsedScheduledAt = parsed;
      computedIsActive = !isPastDate(parsed);
    }

    // Explicitly override isActive flag if the user manually passes it in the body
    if (isActive !== undefined) {
      computedIsActive = !!isActive;
    }

    // 3. Process tags/sports array matching your create listing logic
    let tagsString = existingProfile.tags;
    if (sports !== undefined) {
      tagsString = Array.isArray(sports)
        ? sports.map((sport: string) => sport.trim().toLowerCase()).join(',')
        : String(sports || '').toLowerCase();
    } else if (tags !== undefined) {
      tagsString = String(tags || '').toLowerCase();
    }

    // Map gender preference adjustments if present
    const preference = genderPreference !== undefined 
      ? (genderMap[genderPreference] || genderPreference || 'ANY') 
      : undefined;

    // Build update data object
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (exerciseType !== undefined) updateData.exerciseType = exerciseType;
    if (preference !== undefined) updateData.genderPreference = preference;
    if (scheduledAt !== undefined) updateData.scheduledAt = parsedScheduledAt;
    if (maxInvites !== undefined) updateData.maxInvites = Number(maxInvites) || 1;
    if (goDutch !== undefined) updateData.goDutch = !!goDutch;
    if (moreInfo !== undefined) updateData.moreInfo = moreInfo || null;
    if (tagsString !== undefined) updateData.tags = tagsString;
    if (isActive !== undefined) updateData.isActive = computedIsActive;

    console.log('📦 Update data:', updateData);

    // 4. Perform the transactional update operation
    const updatedProfile = await prisma.profile.update({
      where: {
        id: existingProfile.id
      },
      data: updateData
    });

    console.log('✅ Profile updated successfully:', updatedProfile.id);

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      profile: {
        ...updatedProfile,
        tags: updatedProfile.tags ? updatedProfile.tags.split(',') : []
      }
    });

  } catch (error) {
    console.error('❌ Edit profile listing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile listing',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};