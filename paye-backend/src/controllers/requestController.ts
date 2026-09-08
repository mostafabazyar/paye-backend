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
    const parsedProfileId = parseInt(profileId.toString());

    if (!requesterId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { id: parsedProfileId }
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // User cannot join their own event
    if (profile.userId === requesterId) {
      res.status(400).json({ error: 'You cannot join your own event' });
      return;
    }

    // Event is already closed
    if (!profile.isActive) {
      res.status(400).json({ error: 'This event is no longer active' });
      return;
    }

    // Check if event is already full
    const approvedCount = await prisma.request.count({
      where: {
        profileId: parsedProfileId,
        status: 'APPROVED'
      }
    });

    if (approvedCount >= profile.maxInvites) {
      await prisma.profile.update({
        where: { id: parsedProfileId },
        data: { isActive: false }
      });

      res.status(400).json({ error: 'This event is full' });
      return;
    }

    // Check if request already exists
    const existingRequest = await prisma.request.findUnique({
      where: {
        profileId_requesterId: {
          profileId: parsedProfileId,
          requesterId: requesterId
        }
      }
    });

    if (existingRequest) {
      res.status(400).json({ error: 'Request already sent' });
      return;
    }

    const request = await prisma.request.create({
      data: {
        profileId: parsedProfileId,
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
    const requestId = parseInt(id || '0');

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid request status' });
      return;
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Get request and verify ownership
      const request = await tx.request.findFirst({
        where: {
          id: requestId,
          profile: {
            userId: userId
          }
        },
        include: {
          profile: true
        }
      });

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }

      // If request is already in the requested status, return it
      if (request.status === status) {
        return tx.request.findUnique({
          where: { id: requestId },
          include: {
            requester: {
              select: {
                id: true,
                phone: true
              }
            }
          }
        });
      }

      // Only APPROVED requests consume event capacity
      if (status === 'APPROVED') {
        // Lock the profile row so simultaneous approvals
        // for the same event are processed one by one.
        await tx.$queryRaw`
          SELECT id
          FROM Profile
          WHERE id = ${request.profileId}
          FOR UPDATE
        `;

        const profile = await tx.profile.findUnique({
          where: { id: request.profileId }
        });

        if (!profile) {
          throw new Error('PROFILE_NOT_FOUND');
        }

        if (!profile.isActive) {
          throw new Error('EVENT_CLOSED');
        }

        const approvedCount = await tx.request.count({
          where: {
            profileId: request.profileId,
            status: 'APPROVED'
          }
        });

        if (approvedCount >= profile.maxInvites) {
          await tx.profile.update({
            where: { id: request.profileId },
            data: { isActive: false }
          });

          throw new Error('EVENT_FULL');
        }

        const approvedRequest = await tx.request.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
          include: {
            requester: {
              select: {
                id: true,
                phone: true
              }
            }
          }
        });

        // Close event immediately when capacity is reached.
        if (approvedCount + 1 >= profile.maxInvites) {
          await tx.profile.update({
            where: { id: request.profileId },
            data: { isActive: false }
          });
        }

        return approvedRequest;
      }

      return tx.request.update({
        where: { id: requestId },
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
    });

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Update request error:', error);

    if (error instanceof Error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      if (error.message === 'PROFILE_NOT_FOUND') {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      if (error.message === 'EVENT_CLOSED') {
        res.status(400).json({ error: 'This event is no longer active' });
        return;
      }

      if (error.message === 'EVENT_FULL') {
        res.status(400).json({ error: 'This event is full' });
        return;
      }
    }

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
