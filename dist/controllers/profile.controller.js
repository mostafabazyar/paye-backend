"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.exploreProfiles = exports.createListing = exports.setupProfile = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
// Helper to format user response
const formatUserResponse = (user) => {
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
const setupProfile = async (req, res) => {
    try {
        const { name, age, gender, bio } = req.body;
        const userId = req.user?.id || req.userId;
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
        // Generate a new token with updated data
        const token = jsonwebtoken_1.default.sign({ id: updatedUser.id, phone: updatedUser.phone }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: "Profile setup completed successfully",
            user: formatUserResponse(updatedUser),
            token
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};
exports.setupProfile = setupProfile;
const createListing = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { sports, exerciseType = 'ONE_ON_ONE', genderPreference = 'ANY', title, location, maxInvites = 1, goDutch = false, moreInfo, tags } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!title || !location || !sports) {
            return res.status(400).json({ success: false, message: 'Title, location, and sports are required' });
        }
        const sportTags = Array.isArray(sports) ? sports.join(',') : sports;
        const extraTags = tags ? (Array.isArray(tags) ? tags.join(',') : tags) : '';
        const allTags = extraTags ? `${sportTags},${extraTags}` : sportTags;
        const profile = await prisma.profile.create({
            data: {
                userId,
                exerciseType,
                genderPreference,
                title,
                location,
                maxInvites,
                goDutch,
                moreInfo,
                tags: allTags,
                isActive: true
            }
        });
        res.status(201).json({ success: true, profile });
    }
    catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ success: false, message: 'Failed to create listing' });
    }
};
exports.createListing = createListing;
const exploreProfiles = async (req, res) => {
    try {
        const { sport, exerciseType, genderPreference, location } = req.query;
        const where = { isActive: true };
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
                        avgRating: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, profiles });
    }
    catch (error) {
        console.error('Explore listings error:', error);
        res.status(500).json({ success: false, message: 'Failed to load explorer listings' });
    }
};
exports.exploreProfiles = exploreProfiles;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
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
            user: formatUserResponse(user)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
