import { Router } from "express";
import { loginHandler, registerHandler, meHandler } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/login
router.post("/login", loginHandler);

// POST /api/auth/register
router.post("/register", registerHandler);

// GET /api/auth/me  (requiere token)
router.get("/me", authMiddleware, meHandler);

export default router;
