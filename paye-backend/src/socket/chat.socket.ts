import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "../services/chat.service";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

export function setupChatSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_session", async (sessionId: string) => {
      try {
        const userId = socket.data.userId as string;
        if (typeof sessionId !== "string" || !sessionId.trim()) return;

        await ChatService.assertSessionAccess(userId, sessionId);
        socket.join(sessionId);
      } catch {
        socket.emit("error", { message: "Cannot join this chat" });
      }
    });

    socket.on("send_message", async (data: { sessionId: string; text: string }) => {
      try {
        const userId = socket.data.userId as string;
        if (!data?.sessionId || !data?.text?.trim()) return;

        const message = await ChatService.createMessage(
          userId,
          data.sessionId,
          data.text.trim()
        );

        io.to(data.sessionId).emit("new_message", message);
      } catch (error) {
        console.error("send_message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
