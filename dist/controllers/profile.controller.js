"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreListings = exports.createProfileListing = exports.getProfile = exports.setupProfile = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const parseDateOrNull = (value) => {
    if (!value)
        return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};
const isPastDate = (value) => {
    if (!value)
        return false;
    const date = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};
// Helper to format user response
const formatUserResponse = (user) => {
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
const setupProfile = async (req, res) => {
    try {
        const { name, age, gender, interestedIn, preferredSports, preferredSessionTypes, bio } = req.body;
        const userId = req.user?.id || req.userId;
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
        const token = jsonwebtoken_1.default.sign({ id: updatedUser.id, phone: updatedUser.phone }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Profile setup completed successfully',
            user: formatUserResponse(updatedUser),
            token,
        });
    }
    catch (error) {
        console.error('Setup profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};
exports.setupProfile = setupProfile;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: formatUserResponse(user) });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
// Create a new profile/listing for the current user
const createProfileListing = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { sports, exerciseType, genderPreference, title, location, scheduledAt, maxInvites = 1, goDutch = false, moreInfo, tags, } = req.body;
        const parsedScheduledAt = parseDateOrNull(scheduledAt);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (scheduledAt && !parsedScheduledAt) {
            return res.status(400).json({ success: false, message: 'Invalid schedule time' });
        }
        // Map sports array to tags string if provided
        const tagsString = Array.isArray(sports)
            ? sports.map((sport) => sport.trim().toLowerCase()).join(',')
            : String(tags || '').toLowerCase();
        const profile = await prisma.profile.create({
            data: {
                userId,
                exerciseType: exerciseType || 'ONE_ON_ONE',
                genderPreference: genderPreference || 'ANY',
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
    }
    catch (error) {
        console.error('Create profile listing error:', error);
        res.status(500).json({ success: false, message: 'Failed to create profile listing' });
    }
};
exports.createProfileListing = createProfileListing;
// Explore profile listings, optional filter by sport via query param
const exploreListings = async (req, res) => {
    try {
        const { sport, skip = '0', take = '20', exerciseType, genderPreference, location, sortBy = 'newest' } = req.query;
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
        const where = { isActive: true };
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
        const orderBy = sortBy === 'soonest'
            ? [{ scheduledAt: 'asc' }, { createdAt: 'desc' }]
            : sortBy === 'oldest'
                ? { createdAt: 'asc' }
                : { createdAt: 'desc' };
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
    }
    catch (error) {
        console.error('Explore listings error:', error);
        res.status(500).json({ success: false, message: 'Failed to explore listings' });
    }
};
exports.exploreListings = exploreListings;
