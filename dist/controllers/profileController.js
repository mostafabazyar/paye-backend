"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProfiles = exports.deleteProfile = exports.updateProfile = exports.getUserProfiles = exports.createProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { exerciseType, genderPreference, title, location, maxInvites, goDutch, moreInfo, tags } = req.body;
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
    }
    catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
};
exports.createProfile = createProfile;
const getUserProfiles = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get profiles error:', error);
        res.status(500).json({ error: 'Failed to get profiles' });
    }
};
exports.getUserProfiles = getUserProfiles;
const updateProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
};
exports.deleteProfile = deleteProfile;
const getAllProfiles = async (req, res) => {
    try {
        const { search, exerciseType, genderPreference } = req.query;
        const where = { isActive: true };
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
    }
    catch (error) {
        console.error('Get all profiles error:', error);
        res.status(500).json({ error: 'Failed to get profiles' });
    }
};
exports.getAllProfiles = getAllProfiles;
