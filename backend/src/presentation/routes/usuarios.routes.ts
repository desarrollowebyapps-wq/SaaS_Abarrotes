import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import * as ctrl from "../controllers/usuarios.controller.js";

const router = Router();

// Solo admin puede gestionar usuarios
router.use(authMiddleware, requireRole("admin"));

router.get("/", ctrl.listar);
router.post("/", ctrl.crear);
router.put("/:id", ctrl.actualizar);
router.patch("/:id/toggle", ctrl.toggleActivo);

export default router;
