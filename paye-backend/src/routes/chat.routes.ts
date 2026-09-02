import express from "express";
import { ChatController } from "../controllers/chat.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);
router.get("/conversations", ChatController.getConversations);
router.get("/:sessionId", ChatController.getBySession);

export default router;
