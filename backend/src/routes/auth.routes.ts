import { Router } from "express";
import { loginController, registerController } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/login
router.post("/login", loginController);

// POST /api/auth/register
router.post("/register", registerController);

export default router;