import { Router } from "express";

import {
  listDrafts,
  getDraftById,
  deleteDraft,
} from "../../controllers/admin/adminDraft.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", listDrafts);
router.get("/:id", getDraftById);
router.delete("/:id", deleteDraft);

export default router;