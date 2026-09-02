import prisma from "../prisma";

const userSelect = { id: true, name: true };
const senderSelect = { id: true, name: true };

export const ChatService = {
  async assertSessionAccess(userId: string, sessionId: string) {
    const requestId = parseInt(sessionId, 10);
    if (Number.isNaN(requestId)) {
      throw new Error("Invalid session");
    }

    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        status: "APPROVED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    });

    if (!request) {
      throw new Error("Forbidden");
    }

    return request;
  },

  async getConversations(userId: string) {
    const requests = await prisma.request.findMany({
      where: {
        status: "APPROVED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: { select: userSelect },
        receiver: { select: userSelect },
        profile: { select: { title: true, location: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return requests.map((request) => ({
      sessionId: String(request.id),
      partner:
        request.requesterId === userId ? request.receiver : request.requester,
      profile: request.profile,
      updatedAt: request.updatedAt,
    }));
  },

  async createMessage(senderId: string, sessionId: string, text: string) {
    await this.assertSessionAccess(senderId, sessionId);

    return prisma.message.create({
      data: { senderId, sessionId, text },
      include: { sender: { select: senderSelect } },
    });
  },

  async getMessages(userId: string, sessionId: string) {
    await this.assertSessionAccess(userId, sessionId);

    return prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: senderSelect } },
    });
  },
};
