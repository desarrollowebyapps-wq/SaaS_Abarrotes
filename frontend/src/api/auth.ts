import { api } from "./client";
import type { AuthResponse } from "../types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  tienda_nombre: string;
  tienda_rfc: string;
  tienda_domicilio: string;
  tienda_email: string;
  tienda_telefonos?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}
