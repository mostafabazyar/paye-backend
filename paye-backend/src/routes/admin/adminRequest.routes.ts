import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

import {
  getAdminRequests,
  getAdminRequestById,
  approveAdminRequest,
  rejectAdminRequest,
  pendingAdminRequest,
  deleteAdminRequest,
} from "../../controllers/admin/adminRequest.controller";

const router = Router();

// Every admin request must be authenticated
// and verified as an admin.
router.use(authMiddleware);
router.use(adminMiddleware);

// List requests
router.get("/", getAdminRequests);

// Request actions
router.patch("/:id/approve", approveAdminRequest);
router.patch("/:id/reject", rejectAdminRequest);
router.patch("/:id/pending", pendingAdminRequest);

// Request details
router.get("/:id", getAdminRequestById);

// Delete
router.delete("/:id", deleteAdminRequest);

export default router;