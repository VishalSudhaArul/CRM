import { Router } from "express";
import {
  createProductController,
  getProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Logged-in users can view products
router.get("/", authMiddleware, getProductsController);
router.get("/:id", authMiddleware, getProductController);

// ADMIN and WAREHOUSE can create, update, delete products
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "WAREHOUSE"),
  createProductController
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "WAREHOUSE"),
  updateProductController
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "WAREHOUSE"),
  deleteProductController
);

export default router;