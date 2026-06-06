// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupProfile = async (req: Request, res: Response) => {
  try {
    const { name, age, gender, bio } = req.body;
    const userId = (req as any).user?.id; // From JWT middleware (we'll add later)

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        age: parseInt(age),
        gender,
        bio,
        isVerified: true,
      },
    });

    console.log(`✅ Profile setup completed for user: ${userId}`);

    res.json({
      success: true,
      message: "Profile setup completed successfully",
      user: updatedUser
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};