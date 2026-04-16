import { api } from "./client";

export async function getReporteVentas(desde: string, hasta: string) {
  const { data } = await api.get("/reportes/ventas", { params: { desde, hasta } });
  return data;
}

export async function getReporteInventario() {
  const { data } = await api.get("/reportes/inventario");
  return data;
}

export async function getTopProductos(desde: string, hasta: string) {
  const { data } = await api.get("/reportes/top-productos", { params: { desde, hasta } });
  return data;
}
