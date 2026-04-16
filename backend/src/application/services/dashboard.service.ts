import { prisma } from "../../lib/prisma.js";

export async function getDashboard(tiendaId: string) {
  const ahora = new Date();
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hace7dias = new Date(ahora);
  hace7dias.setDate(hace7dias.getDate() - 6);
  hace7dias.setHours(0, 0, 0, 0);

  const [
    ventasHoy,
    ingresosMes,
    totalProductos,
    stockBajoCount,
    totalClientes,
    ultimasVentas,
    productosStockBajo,
    ventasPorDia,
  ] = await Promise.all([
    // Ventas del día
    prisma.venta.aggregate({
      where: { tienda_id: tiendaId, estado: "completada", createdAt: { gte: inicioDia } },
      _count: { id: true },
      _sum: { total_neto: true },
    }),

    // Ingresos del mes
    prisma.venta.aggregate({
      where: { tienda_id: tiendaId, estado: "completada", createdAt: { gte: inicioMes } },
      _sum: { total_neto: true },
    }),

    // Total productos activos
    prisma.producto.count({ where: { tienda_id: tiendaId, activo: true } }),

    // Productos con stock bajo
    prisma.producto.count({
      where: {
        tienda_id: tiendaId,
        activo: true,
        stock_actual: { lte: 5 },
      },
    }),

    // Total clientes
    prisma.cliente.count({ where: { tienda_id: tiendaId } }),

    // Últimas 5 ventas
    prisma.venta.findMany({
      where: { tienda_id: tiendaId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        numero_ticket: true,
        total_neto: true,
        metodo_pago: true,
        estado: true,
        createdAt: true,
        cliente: { select: { nombre: true } },
        detalles: { select: { id: true } },
      },
    }),

    // Top 5 productos con stock bajo
    prisma.producto.findMany({
      where: { tienda_id: tiendaId, activo: true, stock_actual: { lte: 5 } },
      orderBy: { stock_actual: "asc" },
      take: 5,
      select: {
        id: true,
        nombre: true,
        stock_actual: true,
        stock_minimo: true,
        unidad_medida: true,
        categoria: { select: { nombre: true } },
      },
    }),

    // Ventas agrupadas por día (últimos 7 días)
    prisma.venta.findMany({
      where: {
        tienda_id: tiendaId,
        estado: "completada",
        createdAt: { gte: hace7dias },
      },
      select: { createdAt: true, total_neto: true },
    }),
  ]);

  // Agrupar ventas por día
  const ventasMap: Record<string, { dia: string; ventas: number; ingresos: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(ahora);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
    ventasMap[key] = { dia: label, ventas: 0, ingresos: 0 };
  }

  for (const v of ventasPorDia) {
    const key = v.createdAt.toISOString().slice(0, 10);
    if (ventasMap[key]) {
      ventasMap[key].ventas += 1;
      ventasMap[key].ingresos += v.total_neto;
    }
  }

  return {
    kpis: {
      ventas_hoy: ventasHoy._count.id,
      ingresos_hoy: ventasHoy._sum.total_neto ?? 0,
      ingresos_mes: ingresosMes._sum.total_neto ?? 0,
      total_productos: totalProductos,
      stock_bajo: stockBajoCount,
      total_clientes: totalClientes,
    },
    ultimas_ventas: ultimasVentas.map((v) => ({
      ...v,
      items: v.detalles.length,
    })),
    productos_stock_bajo: productosStockBajo,
    grafica_7dias: Object.values(ventasMap),
  };
}
