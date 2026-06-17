import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RequestControllerRequest extends Request {
  userId?: string;
  body: {
    profileId: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
  params: {
    id?: string;
    profileId?: string;
  };
}

const sendRequest = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id || req.userId;
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
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
};

const getProfileRequests = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.userId;
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
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
};

const updateRequestStatus = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.userId;
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
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
};

const getUserReceivedRequests = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requests = await prisma.request.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        requester: {
          select: {
            id: true,
            phone: true,
            name: true,
          },
        },
        profile: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
};

const getUserSentRequests = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requests = await prisma.request.findMany({
      where: {
        requesterId: userId
      },
      include: {
        profile: true,
        receiver: {
          select: { id: true, name: true, phone: true },
        },
        requester: {
          select: { id: true, phone: true, name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
};

const getRequestById = async (req: RequestControllerRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = await prisma.request.findFirst({
      where: {
        id: parseInt(id || '0'),
        OR: [
          { requesterId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        profile: true,
        requester: {
          select: { id: true, phone: true }
        }
      }
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to get request' });
  }
};

export {
  sendRequest,
  getProfileRequests,
  updateRequestStatus,
  getUserReceivedRequests,
  getUserSentRequests,
  getRequestById
};
