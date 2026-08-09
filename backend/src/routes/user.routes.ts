import { Router } from "express";

import {
  createUserController,
  getUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// CREATE USER
// Anyone with a valid login token can create a user
router.post(
  "/",
  authMiddleware,
  createUserController
);

// GET ALL USERS
// ADMIN only
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  getUsersController
);

// GET SINGLE USER
// ADMIN only
router.get(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  getUserController
);

// UPDATE USER
// ADMIN only
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  updateUserController
);

// DELETE USER
// ADMIN only
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  deleteUserController
);

export default router;