import { Request, Response } from "express";
import { getDashboard } from "../../application/services/dashboard.service.js";

export async function dashboardHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDashboard(req.user!.tienda_id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
}
