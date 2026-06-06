const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sendRequest = async (req, res) => {
  try {
    const requesterId = req.userId;
    const { profileId } = req.body;
    
    // Check if request already exists
    const existingRequest = await prisma.request.findUnique({
      where: {
        profileId_requesterId: {
          profileId: parseInt(profileId),
          requesterId
        }
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent' });
    }
    
    // Get profile to get receiverId
    const profile = await prisma.profile.findUnique({
      where: { id: parseInt(profileId) }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const request = await prisma.request.create({
      data: {
        profileId: parseInt(profileId),
        requesterId,
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
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
};

const getProfileRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileId } = req.params;
    
    const requests = await prisma.request.findMany({
      where: {
        profileId: parseInt(profileId),
        profile: {
          userId
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
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;
    
    // Check ownership through profile
    const request = await prisma.request.findFirst({
      where: {
        id: parseInt(id),
        profile: {
          userId
        }
      }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const updatedRequest = await prisma.request.update({
      where: { id: parseInt(id) },
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
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
};

const getUserReceivedRequests = async (req, res) => {
  try {
    const userId = req.userId;
    
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
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
};

module.exports = {
  sendRequest,
  getProfileRequests,
  updateRequestStatus,
  getUserReceivedRequests
};