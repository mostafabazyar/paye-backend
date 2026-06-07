"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReceivedRequests = exports.updateRequestStatus = exports.getProfileRequests = exports.sendRequest = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sendRequest = async (req, res) => {
    try {
        const requesterId = req.user?.id || req.userId;
        const { profileId } = req.body;
        if (!requesterId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Check if request already exists
        const existingRequest = await prisma.request.findUnique({
            where: {
                profileId_requesterId: {
                    profileId: parseInt(profileId.toString()),
                    requesterId: requesterId
                }
            }
        });
        if (existingRequest) {
            res.status(400).json({ error: 'Request already sent' });
            return;
        }
        // Get profile to get receiverId
        const profile = await prisma.profile.findUnique({
            where: { id: parseInt(profileId.toString()) }
        });
        if (!profile) {
            res.status(404).json({ error: 'Profile not found' });
            return;
        }
        const request = await prisma.request.create({
            data: {
                profileId: parseInt(profileId.toString()),
                requesterId: requesterId,
                receiverId: profile.userId,
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        phone: true
                    }
                }
            }
        });
        res.status(201).json({ success: true, request });
    }
    catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({ error: 'Failed to send request' });
    }
};
exports.sendRequest = sendRequest;
const getProfileRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { profileId } = req.params;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const requests = await prisma.request.findMany({
            where: {
                profileId: parseInt(profileId || '0'),
                profile: {
                    userId: userId
                }
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        phone: true
                    }
                },
                profile: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, requests });
    }
    catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
};
exports.getProfileRequests = getProfileRequests;
const updateRequestStatus = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { id } = req.params;
        const { status } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Check ownership through profile
        const request = await prisma.request.findFirst({
            where: {
                id: parseInt(id || '0'),
                profile: {
                    userId: userId
                }
            }
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        const updatedRequest = await prisma.request.update({
            where: { id: parseInt(id || '0') },
            data: { status },
            include: {
                requester: {
                    select: {
                        id: true,
                        phone: true
                    }
                }
            }
        });
        res.json({ success: true, request: updatedRequest });
    }
    catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
};
exports.updateRequestStatus = updateRequestStatus;
const getUserReceivedRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const requests = await prisma.request.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        phone: true
                    }
                },
                profile: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, requests });
    }
    catch (error) {
        console.error('Get received requests error:', error);
        res.status(500).json({ error: 'Failed to get requests' });
    }
};
exports.getUserReceivedRequests = getUserReceivedRequests;
