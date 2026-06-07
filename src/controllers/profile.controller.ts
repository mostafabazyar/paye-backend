// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper to format user response
const formatUserResponse = (user: any) => {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name || null,
    age: user.age || null,
    gender: user.gender || null,
    bio: user.bio || null,
    photos: user.photos ? JSON.parse(user.photos) : [],
    avgRating: user.avgRating,
    isVerified: user.isVerified,
  };
};

export const setupProfile = async (req: Request, res: Response) => {
  try {
    const { name, age, gender, bio } = req.body;
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
      maxInvites = 1,
      goDutch = false,
      moreInfo,
      tags,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Map sports array to tags string if provided
    const tagsString = Array.isArray(sports) ? sports.join(',') : tags || '';

    const profile = await prisma.profile.create({
      data: {
        userId,
        exerciseType: exerciseType || 'ONE_ON_ONE',
        genderPreference: genderPreference || 'ANY',
        title,
        location,
        maxInvites: Number(maxInvites) || 1,
        goDutch: !!goDutch,
        moreInfo: moreInfo || null,
        tags: tagsString,
        isActive: true,
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
    const { sport, skip = '0', take = '20', exerciseType, genderPreference, location } = req.query as any;

    const where: any = { isActive: true };

    if (sport) {
      where.tags = { contains: sport, mode: 'insensitive' };
    }

    if (exerciseType) {
      where.exerciseType = exerciseType;
    }

    if (genderPreference) {
      where.genderPreference = genderPreference;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

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
      orderBy: { createdAt: 'desc' },
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
      createdAt: p.createdAt,
      user: formatUserResponse(p.user),
    }));

    res.json({ success: true, profiles: formatted });
  } catch (error) {
    console.error('Explore listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to explore listings' });
  }
};