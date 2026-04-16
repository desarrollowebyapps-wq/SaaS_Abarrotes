import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createVenta, listVentas } from "../controllers/ventas.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/", listVentas);
router.post("/", createVenta);

export default router;
