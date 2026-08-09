import { Router } from "express";
import {
  createChallanController,
  getChallansController,
  getChallanController,
  updateChallanStatusController,
} from "../controllers/challan.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// View challans (ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getChallansController
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getChallanController
);

// Create challan (ADMIN, SALES)
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "SALES"),
  createChallanController
);

// Update challan status (CONFIRMED / CANCELLED) (ADMIN, SALES, WAREHOUSE)
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("ADMIN", "SALES", "WAREHOUSE"),
  updateChallanStatusController
);

export default router;
