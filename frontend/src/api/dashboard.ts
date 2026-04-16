import { api } from "./client";

export interface DashboardData {
  kpis: {
    ventas_hoy: number;
    ingresos_hoy: number;
    ingresos_mes: number;
    total_productos: number;
    stock_bajo: number;
    total_clientes: number;
  };
  ultimas_ventas: Array<{
    id: string;
    numero_ticket: string;
    total_neto: number;
    metodo_pago: string;
    estado: string;
    items: number;
    createdAt: string;
    cliente: { nombre: string } | null;
  }>;
  productos_stock_bajo: Array<{
    id: string;
    nombre: string;
    stock_actual: number;
    stock_minimo: number;
    unidad_medida: string;
    categoria: { nombre: string };
  }>;
  grafica_7dias: Array<{
    dia: string;
    ventas: number;
    ingresos: number;
  }>;
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get("/dashboard");
  return data;
}
