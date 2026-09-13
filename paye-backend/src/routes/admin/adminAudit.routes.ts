import { Router } from "express";

import {
  getAuditLogs,
  getAuditLogById,
} from "../../controllers/admin/adminAudit.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);

export default router;