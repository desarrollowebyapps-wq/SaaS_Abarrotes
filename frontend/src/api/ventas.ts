import { api } from "./client";

export interface ItemVenta {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  descuento_item?: number;
}

export interface CreateVentaPayload {
  items: ItemVenta[];
  descuento?: number;
  metodo_pago: string;
  cliente_id?: string;
  notas?: string;
}

export async function createVenta(payload: CreateVentaPayload) {
  const { data } = await api.post("/ventas", payload);
  return data;
}

export async function getVentas(params?: { pagina?: number }) {
  const { data } = await api.get("/ventas", { params });
  return data;
}
