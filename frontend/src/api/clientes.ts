import { api } from "./client";

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  tipo: string;
  credito_limite: number;
  credito_usado: number;
  createdAt: string;
  _count?: { ventas: number };
}

export interface ClienteDetalle extends Cliente {
  ventas: Array<{
    id: string;
    numero_ticket: string;
    total_neto: number;
    metodo_pago: string;
    estado: string;
    createdAt: string;
  }>;
}

export async function getClientes(params?: {
  busqueda?: string;
  tipo?: string;
  pagina?: number;
}): Promise<{ clientes: Cliente[]; total: number; paginas: number; pagina: number }> {
  const { data } = await api.get("/clientes", { params });
  return data;
}

export async function getCliente(id: string): Promise<ClienteDetalle> {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
}

export async function createCliente(body: Omit<Cliente, "id" | "credito_usado" | "createdAt" | "_count">) {
  const { data } = await api.post("/clientes", body);
  return data;
}

export async function updateCliente(id: string, body: Partial<Cliente>) {
  const { data } = await api.put(`/clientes/${id}`, body);
  return data;
}

export async function deleteCliente(id: string) {
  await api.delete(`/clientes/${id}`);
}
