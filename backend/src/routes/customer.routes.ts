import { Router } from "express";
import {
  createCustomerController,
  getCustomersController,
  getCustomerController,
  updateCustomerController,
  addFollowUpNoteController,
  deleteCustomerController,
} from "../controllers/customer.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// View customers (Authenticated users: ADMIN, SALES, WAREHOUSE, ACCOUNTS)
router.get("/", authMiddleware, getCustomersController);
router.get("/:id", authMiddleware, getCustomerController);

// Manage customers (ADMIN and SALES)
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "SALES"),
  createCustomerController
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "SALES"),
  updateCustomerController
);

// Add follow-up notes (ADMIN and SALES)
router.post(
  "/:id/follow-up",
  authMiddleware,
  requireRole("ADMIN", "SALES"),
  addFollowUpNoteController
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "SALES"),
  deleteCustomerController
);

export default router;