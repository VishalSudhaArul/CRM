import { Router } from "express";
import {
  createStockMovementController,
  getStockMovementsController,
  getStockMovementController,
} from "../controllers/stockMovement.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// View stock movements (All authenticated roles: ADMIN, WAREHOUSE, ACCOUNTS, SALES)
router.get("/", authMiddleware, getStockMovementsController);
router.get("/:id", authMiddleware, getStockMovementController);

// Log stock movement IN / OUT (ADMIN and WAREHOUSE)
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "WAREHOUSE"),
  createStockMovementController
);

export default router;
