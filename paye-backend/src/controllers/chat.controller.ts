import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";

type AuthedRequest = Request & { userId?: string };

export const ChatController = {
  async getConversations(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversations = await ChatService.getConversations(userId);
    res.json(conversations);
  },

  async getBySession(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const messages = await ChatService.getMessages(userId, sessionId);
      res.json(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Forbidden";
      if (message === "Forbidden" || message === "Invalid session") {
        return res.status(403).json({ message: "You cannot access this chat" });
      }
      throw error;
    }
  },
};
