import { Request, Response } from "express";
import * as svc from "../../application/services/usuarios.service.js";

export async function listar(req: Request, res: Response) {
  try {
    const usuarios = await svc.listarUsuarios(req.user!.tienda_id);
    res.json(usuarios);
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Error" });
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const usuario = await svc.crearUsuario(req.user!.tienda_id, req.body);
    res.status(201).json(usuario);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(msg.includes("Ya existe") ? 409 : 500).json({ error: msg });
  }
}

export async function actualizar(req: Request, res: Response) {
  try {
    const usuario = await svc.actualizarUsuario(
      req.user!.tienda_id,
      req.params.id,
      req.body
    );
    res.json(usuario);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(msg.includes("no encontrado") ? 404 : 500).json({ error: msg });
  }
}

export async function toggleActivo(req: Request, res: Response) {
  try {
    const result = await svc.toggleActivo(
      req.user!.tienda_id,
      req.params.id,
      req.user!.sub
    );
    res.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(msg.includes("no encontrado") ? 404 : 400).json({ error: msg });
  }
}
