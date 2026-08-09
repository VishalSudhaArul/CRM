import { Router } from "express";
import { getDashboardStatsController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All logged-in users can view dashboard stats
router.get("/stats", authMiddleware, getDashboardStatsController);

export default router;
