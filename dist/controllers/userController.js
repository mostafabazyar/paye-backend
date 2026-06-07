"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.updateUserPhotos = exports.getCurrentUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
/**
 * Get all users for discovery (paginated)
 * Query params: skip (default 0), take (default 10)
 */
const getAllUsers = async (req, res) => {
    try {
        const skip = parseInt(req.query.skip || '0');
        const take = parseInt(req.query.take || '10');
        const currentUserId = req.user?.id || req.userId;
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
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get a specific user by ID
 */
const getUserById = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
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
            user: formatUserResponse(user),
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Update user photos
 */
const updateUserPhotos = async (req, res) => {
    try {
        const { photos } = req.body;
        const userId = req.user?.id || req.userId;
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
    }
    catch (error) {
        console.error('Update user photos error:', error);
        res.status(500).json({ success: false, message: 'Failed to update photos' });
    }
};
exports.updateUserPhotos = updateUserPhotos;
/**
 * Search users by name or other criteria
 */
const searchUsers = async (req, res) => {
    try {
        const { query, skip = 0, take = 10 } = req.query;
        const currentUserId = req.user?.id || req.userId;
        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                isVerified: true,
                name: { not: null },
                OR: [
                    { name: { contains: query } },
                    { bio: { contains: query } },
                ],
            },
            skip: parseInt(skip),
            take: parseInt(take),
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            users: users.map(formatUserResponse),
        });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Failed to search users' });
    }
};
exports.searchUsers = searchUsers;
