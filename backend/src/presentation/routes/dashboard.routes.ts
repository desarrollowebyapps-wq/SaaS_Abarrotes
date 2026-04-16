import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { dashboardHandler } from "../controllers/dashboard.controller.js";

const router = Router();
router.use(authMiddleware);
router.get("/", dashboardHandler);

export default router;
