import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserControllerRequest extends Request {
  userId?: string;
  body: {
    name?: string;
    age?: number;
    gender?: string;
    bio?: string;
    photos?: string[];
  };
  params: {
    id?: string;
  };
}

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

/**
 * Get all users for discovery (paginated)
 * Query params: skip (default 0), take (default 10)
 */
export const getAllUsers = async (req: UserControllerRequest, res: Response) => {
  try {
    const skip = parseInt((req.query.skip as string) || '0');
    const take = parseInt((req.query.take as string) || '10');
    const currentUserId = (req as any).user?.id || req.userId;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get users excluding the current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isVerified: true,
        name: { not: null }, // Only users with completed profiles
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({
      where: {
        id: { not: currentUserId },
        isVerified: true,
        name: { not: null },
      },
    });

    res.json({
      success: true,
      users: users.map(formatUserResponse),
      total,
      skip,
      take,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * Get a specific user by ID
 */
export const getUserById = async (req: UserControllerRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: UserControllerRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

/**
 * Update user photos
 */
export const updateUserPhotos = async (req: UserControllerRequest, res: Response) => {
  try {
    const { photos } = req.body;
    const userId = (req as any).user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(photos)) {
      return res.status(400).json({ success: false, message: 'Photos must be an array' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        photos: JSON.stringify(photos),
      },
    });

    res.json({
      success: true,
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update user photos error:', error);
    res.status(500).json({ success: false, message: 'Failed to update photos' });
  }
};

/**
 * Search users by name or other criteria
 */
export const searchUsers = async (req: UserControllerRequest, res: Response) => {
  try {
    const { query, skip = 0, take = 10 } = req.query;
    const currentUserId = (req as any).user?.id || req.userId;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isVerified: true,
        name: { not: null },
        OR: [
          { name: { contains: query as string } },
          { bio: { contains: query as string } },
        ],
      },
      skip: parseInt(skip as string),
      take: parseInt(take as string),
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      users: users.map(formatUserResponse),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};
