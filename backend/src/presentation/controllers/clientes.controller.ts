import { Request, Response } from "express";
import * as svc from "../../application/services/clientes.service.js";

export async function listClientes(req: Request, res: Response): Promise<void> {
  try {
    const { busqueda, tipo, pagina, limite } = req.query;
    const data = await svc.getClientes(req.user!.tienda_id, {
      busqueda: busqueda as string,
      tipo: tipo as string,
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 20,
    });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
}

export async function getCliente(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.getClienteById(req.user!.tienda_id, req.params.id);
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(404).json({ error: msg });
  }
}

export async function createCliente(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.createCliente(req.user!.tienda_id, req.body);
    res.status(201).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}

export async function updateCliente(req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.updateCliente(req.user!.tienda_id, req.params.id, req.body);
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}

export async function deleteCliente(req: Request, res: Response): Promise<void> {
  try {
    await svc.deleteCliente(req.user!.tienda_id, req.params.id);
    res.status(204).send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    res.status(400).json({ error: msg });
  }
}
