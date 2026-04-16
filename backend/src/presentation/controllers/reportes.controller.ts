import { Request, Response } from "express";
import * as svc from "../../application/services/reportes.service.js";

function defaultRange() {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);
  return {
    desde: inicio.toISOString().slice(0, 10),
    hasta: fin.toISOString().slice(0, 10),
  };
}

export async function reporteVentas(req: Request, res: Response): Promise<void> {
  try {
    const range = defaultRange();
    const desde = (req.query.desde as string) ?? range.desde;
    const hasta = (req.query.hasta as string) ?? range.hasta;
    const data = await svc.getReporteVentas(req.user!.tienda_id, desde, hasta);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar reporte de ventas" });
  }
}

export async function reporteInventario(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.getReporteInventario(req.user!.tienda_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar reporte de inventario" });
  }
}

export async function topProductos(req: Request, res: Response): Promise<void> {
  try {
    const range = defaultRange();
    const desde = (req.query.desde as string) ?? range.desde;
    const hasta = (req.query.hasta as string) ?? range.hasta;
    const data = await svc.getTopProductos(req.user!.tienda_id, desde, hasta);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar top productos" });
  }
}
