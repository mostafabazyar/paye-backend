import { Router } from "express";

import {
  impersonateUser,
} from "../../controllers/admin/adminImpersonation.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

/**
 * Start impersonation
 *
 * POST /api/admin/impersonation/:userId
 */
router.post(
  "/:userId",
  authMiddleware,
  adminMiddleware,
  impersonateUser
);

export default router;