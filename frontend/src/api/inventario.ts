import { api } from "./client";

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_costo: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  activo: boolean;
  categoria: { id: string; nombre: string };
}

export interface ProductosResponse {
  productos: Producto[];
  total: number;
  pagina: number;
  paginas: number;
}

export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await api.get("/inventario/categorias");
  return data;
}

export async function createCategoria(nombre: string, descripcion?: string) {
  const { data } = await api.post("/inventario/categorias", { nombre, descripcion });
  return data;
}

export async function getProductos(params?: {
  busqueda?: string;
  categoria_id?: string;
  pagina?: number;
}): Promise<ProductosResponse> {
  const { data } = await api.get("/inventario/productos", { params });
  return data;
}

export async function createProducto(body: {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_costo: number;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
  categoria_id: string;
  unidad_medida?: string;
}) {
  const { data } = await api.post("/inventario/productos", body);
  return data;
}

export async function updateProducto(id: string, body: Partial<Parameters<typeof createProducto>[0]>) {
  const { data } = await api.put(`/inventario/productos/${id}`, body);
  return data;
}

export async function deleteProducto(id: string) {
  await api.delete(`/inventario/productos/${id}`);
}

export interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  referencia: string | null;
  createdAt: string;
  producto: { nombre: string; codigo: string; unidad_medida: string };
}

export interface MovimientosResponse {
  movimientos: Movimiento[];
  total: number;
  pagina: number;
  paginas: number;
}

export async function getMovimientos(params?: {
  producto_id?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
}): Promise<MovimientosResponse> {
  const { data } = await api.get("/inventario/movimientos", { params });
  return data;
}

export async function ajustarStock(
  id: string,
  body: { nueva_cantidad: number; motivo: string; notas?: string }
): Promise<Producto> {
  const { data } = await api.post(`/inventario/productos/${id}/ajuste`, body);
  return data;
}
