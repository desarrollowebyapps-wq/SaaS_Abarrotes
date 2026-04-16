import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { reporteVentas, reporteInventario, topProductos } from "../controllers/reportes.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/ventas", reporteVentas);
router.get("/inventario", reporteInventario);
router.get("/top-productos", topProductos);

export default router;
