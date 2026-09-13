import { Router } from "express";

import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  blockAdminUser,
  unblockAdminUser,
  verifyAdminUser,
  unverifyAdminUser,
} from "../../controllers/admin/adminUser.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// List users
router.get("/", getAdminUsers);

// User actions
router.patch("/:id/block", blockAdminUser);
router.patch("/:id/unblock", unblockAdminUser);
router.patch("/:id/verify", verifyAdminUser);
router.patch("/:id/unverify", unverifyAdminUser);

// User details
router.get("/:id", getAdminUserById);

// Edit user
router.put("/:id", updateAdminUser);

// Delete user
router.delete("/:id", deleteAdminUser);

export default router;