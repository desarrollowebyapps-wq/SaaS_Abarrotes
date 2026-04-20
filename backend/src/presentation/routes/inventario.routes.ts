import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  listCategorias, createCategoria,
  listProductos, createProducto, updateProducto, deleteProducto,
  ajustarStock, listMovimientos,
} from "../controllers/inventario.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/categorias", listCategorias);
router.post("/categorias", createCategoria);

router.get("/productos", listProductos);
router.post("/productos", createProducto);
router.put("/productos/:id", updateProducto);
router.delete("/productos/:id", deleteProducto);
router.post("/productos/:id/ajuste", ajustarStock);
router.get("/movimientos", listMovimientos);

export default router;
