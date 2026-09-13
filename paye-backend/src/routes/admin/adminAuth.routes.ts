import { Router } from "express";

import {
  adminLogin,
  adminVerifyOtp,
  adminMe,
} from "../../controllers/admin/adminAuth.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

router.post("/login", adminLogin);

router.post("/verify", adminVerifyOtp);

router.get(
  "/me",
  authMiddleware,
  adminMiddleware,
  adminMe
);

export default router;