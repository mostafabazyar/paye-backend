import { Router } from "express";

import {
  getAdmins,
  getAdminById,
  createAdmin,
  deleteAdmin,
} from "../../controllers/admin/adminManagement.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

/**
 * All admin management routes require:
 * 1. Valid JWT
 * 2. ADMIN token
 * 3. Existing Admin record
 */
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/admins
 */
router.get("/", getAdmins);

/**
 * GET /api/admin/admins/:id
 */
router.get("/:id", getAdminById);

/**
 * POST /api/admin/admins
 */
router.post("/", createAdmin);

/**
 * DELETE /api/admin/admins/:id
 */
router.delete("/:id", deleteAdmin);

export default router;