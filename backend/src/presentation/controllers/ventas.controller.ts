import { Request, Response } from "express";
import * as svc from "../../application/services/ventas.service.js";

export async function createVenta(req: Request, res: Response): Promise<void> {
  try {
    const venta = await svc.createVenta(req.user!.tienda_id, req.user!.sub, req.body);
    res.status(201).json(venta);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al registrar venta";
    res.status(400).json({ error: msg });
  }
}

export async function listVentas(req: Request, res: Response): Promise<void> {
  try {
    const { pagina, limite } = req.query;
    const data = await svc.getVentas(req.user!.tienda_id, {
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 30,
    });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error al obtener ventas" });
  }
}
