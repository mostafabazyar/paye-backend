import { Router } from "express";

import {
  listSportsAdmin,
  createSport,
  updateSport,
  deleteSport,
} from "../../controllers/sport.controller";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", listSportsAdmin);
router.post("/", createSport);
router.patch("/:id", updateSport);
router.delete("/:id", deleteSport);

export default router;