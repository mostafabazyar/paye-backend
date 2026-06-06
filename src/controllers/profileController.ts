import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProfileRequest extends Request {
  userId?: string;
  body: {
    exerciseType: 'ONE_ON_ONE' | 'MANY_ON_MANY' | 'ONE_ON_MANY';
    genderPreference: 'MEN_ONLY' | 'WOMEN_ONLY' | 'ANY';
    title: string;
    location: string;
    maxInvites?: number;
    goDutch?: boolean;
    moreInfo?: string;
    tags: string[];
  };
  params: {
    id?: string;
  };
  query: {
    search?: string;
    exerciseType?: string;
    genderPreference?: string;
  };
}

const createProfile = async (req: ProfileRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      exerciseType,
      genderPreference,
      title,
      location,
      maxInvites,
      goDutch,
      moreInfo,
      tags
    } = req.body;

    const profile = await prisma.profile.create({
      data: {
        userId: userId || '',
        exerciseType,
        genderPreference,
        title,
        location,
        maxInvites: maxInvites || 1,
        goDutch: goDutch || false,
        moreInfo: moreInfo || null,
        tags: tags.join(','),
        isActive: true
      }
    });

    res.status(201).json({ success: true, profile });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

const getUserProfiles = async (req: ProfileRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const profiles = await prisma.profile.findMany({
      where: { userId: userId || '' },
      include: {
        requests: {
          include: {
            requester: {
              select: {
                id: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, profiles });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
};

const updateProfile = async (req: ProfileRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const existingProfile = await prisma.profile.findFirst({
      where: { id: parseInt(id || '0'), userId: userId || '' }
    });

    if (!existingProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Type the updates properly
    const updateData = {
      exerciseType: updates.exerciseType,
      genderPreference: updates.genderPreference,
      title: updates.title,
      location: updates.location,
      maxInvites: updates.maxInvites,
      goDutch: updates.goDutch,
      moreInfo: updates.moreInfo,
      tags: updates.tags.join(',')
    };

    const profile = await prisma.profile.update({
      where: { id: parseInt(id || '0') },
      data: updateData
    });

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const deleteProfile = async (req: ProfileRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check ownership
    const existingProfile = await prisma.profile.findFirst({
      where: { id: parseInt(id || '0'), userId: userId || '' }
    });

    if (!existingProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    await prisma.profile.delete({
      where: { id: parseInt(id || '0') }
    });

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
};

const getAllProfiles = async (req: ProfileRequest, res: Response): Promise<void> => {
  try {
    const { search, exerciseType, genderPreference } = req.query;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tags: { contains: search } },
        { location: { contains: search } }
      ];
    }

    if (exerciseType) {
      where.exerciseType = exerciseType as 'ONE_ON_ONE' | 'MANY_ON_MANY' | 'ONE_ON_MANY';
    }

    if (genderPreference) {
      where.genderPreference = genderPreference as 'MEN_ONLY' | 'WOMEN_ONLY' | 'ANY';
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
            avgRating: true
          }
        },
        requests: {
          select: {
            id: true,
            status: true
          }
        }
      },
      take: 20
    });

    res.json({ success: true, profiles, total: profiles.length });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
};

export { createProfile, getUserProfiles, updateProfile, deleteProfile, getAllProfiles };
