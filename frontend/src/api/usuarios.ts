import { api } from "./client";

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  ultimo_login: string | null;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get("/usuarios");
  return data;
}

export async function crearUsuario(payload: {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: "vendedor" | "encargado";
}): Promise<Usuario> {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

export async function actualizarUsuario(
  id: string,
  payload: {
    nombre?: string;
    apellido?: string;
    rol?: "vendedor" | "encargado";
    password?: string;
  }
): Promise<Usuario> {
  const { data } = await api.put(`/usuarios/${id}`, payload);
  return data;
}

export async function toggleActivo(id: string): Promise<{ id: string; activo: boolean }> {
  const { data } = await api.patch(`/usuarios/${id}/toggle`);
  return data;
}
