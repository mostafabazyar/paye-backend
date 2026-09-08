import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import adminMiddleware from "../middleware/admin.middleware";
import { getDashboard } from "../controllers/admin.controller";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/dashboard", getDashboard);

export default router;