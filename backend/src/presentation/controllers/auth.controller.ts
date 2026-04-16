import { Request, Response } from "express";
import * as authService from "../../application/services/auth.service.js";

export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al iniciar sesión";
    res.status(401).json({ error: message });
  }
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrarse";
    const status = message.includes("Ya existe") ? 409 : 400;
    res.status(status).json({ error: message });
  }
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.me(req.user!.sub);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    res.status(404).json({ error: message });
  }
}
