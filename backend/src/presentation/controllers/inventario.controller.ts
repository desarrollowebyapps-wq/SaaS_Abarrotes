import { Request, Response } from "express";
import * as svc from "../../application/services/inventario.service.js";

// ── Categorías ─────────────────────────────────────────────

export async function listCategorias(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.getCategorias(req.user!.tienda_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
}

export async function createCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) { res.status(400).json({ error: "Nombre requerido" }); return; }
    const data = await svc.createCategoria(req.user!.tienda_id, nombre, descripcion);
    res.status(201).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}

// ── Productos ──────────────────────────────────────────────

export async function listProductos(req: Request, res: Response): Promise<void> {
  try {
    const { busqueda, categoria_id, stock_bajo, pagina, limite } = req.query;
    const data = await svc.getProductos(req.user!.tienda_id, {
      busqueda: busqueda as string,
      categoria_id: categoria_id as string,
      stock_bajo: stock_bajo === "true",
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 20,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
}

export async function createProducto(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.createProducto(req.user!.tienda_id, req.body);
    res.status(201).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("Ya existe") ? 409 : 400;
    res.status(status).json({ error: msg });
  }
}

export async function updateProducto(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.updateProducto(req.user!.tienda_id, req.params.id, req.body);
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}

export async function deleteProducto(req: Request, res: Response): Promise<void> {
  try {
    await svc.deleteProducto(req.user!.tienda_id, req.params.id);
    res.status(204).send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}

export async function listMovimientos(req: Request, res: Response): Promise<void> {
  try {
    const { producto_id, tipo, desde, hasta, pagina, limite } = req.query;
    const data = await svc.getMovimientos(req.user!.tienda_id, {
      producto_id: producto_id as string,
      tipo: tipo as string,
      desde: desde as string,
      hasta: hasta as string,
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 30,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener movimientos" });
  }
}

export async function ajustarStock(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.ajustarStock(req.user!.tienda_id, req.params.id, req.body);
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(msg.includes("no encontrado") ? 404 : 400).json({ error: msg });
  }
}
