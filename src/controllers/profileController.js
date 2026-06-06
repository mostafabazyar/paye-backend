const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createProfile = async (req, res) => {
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
        userId,
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

const getUserProfiles = async (req, res) => {
  try {
    const userId = req.userId;
    
    const profiles = await prisma.profile.findMany({
      where: { userId },
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

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;
    
    // Check ownership
    const existingProfile = await prisma.profile.findFirst({
      where: { id: parseInt(id), userId }
    });
    
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    if (updates.tags && Array.isArray(updates.tags)) {
      updates.tags = updates.tags.join(',');
    }
    
    const profile = await prisma.profile.update({
      where: { id: parseInt(id) },
      data: updates
    });
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    // Check ownership
    const existingProfile = await prisma.profile.findFirst({
      where: { id: parseInt(id), userId }
    });
    
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    await prisma.profile.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const { search, exerciseType, genderPreference } = req.query;
    
    let where = { isActive: true };
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tags: { contains: search } },
        { location: { contains: search } }
      ];
    }
    
    if (exerciseType) {
      where.exerciseType = exerciseType;
    }
    
    if (genderPreference) {
      where.genderPreference = genderPreference;
    }
    
    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phone: true
          }
        },
        requests: {
          where: { status: 'PENDING' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, profiles });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
};

module.exports = {
  createProfile,
  getUserProfiles,
  updateProfile,
  deleteProfile,
  getAllProfiles
};