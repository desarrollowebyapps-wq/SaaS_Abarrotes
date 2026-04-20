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
    stockBajoRaw,
    totalClientes,
    ultimasVentas,
    productosStockBajoRaw,
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

    // Productos con stock bajo (compara stock_actual vs su propio stock_minimo)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::int as count FROM "Producto"
      WHERE tienda_id = ${tiendaId}
        AND activo = true
        AND stock_actual <= stock_minimo
    `,

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

    // Top 5 productos con stock bajo (stock_actual <= su propio stock_minimo)
    prisma.$queryRaw<Array<{ id: string; nombre: string; stock_actual: number; stock_minimo: number; unidad_medida: string; categoria_nombre: string }>>`
      SELECT p.id, p.nombre, p.stock_actual, p.stock_minimo, p.unidad_medida,
             c.nombre as categoria_nombre
      FROM "Producto" p
      JOIN "Categoria" c ON c.id = p.categoria_id
      WHERE p.tienda_id = ${tiendaId}
        AND p.activo = true
        AND p.stock_actual <= p.stock_minimo
      ORDER BY p.stock_actual ASC
      LIMIT 5
    `,

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

  const stockBajoCount = Number(stockBajoRaw[0]?.count ?? 0);
  const productosStockBajo = productosStockBajoRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    stock_actual: Number(p.stock_actual),
    stock_minimo: Number(p.stock_minimo),
    unidad_medida: p.unidad_medida,
    categoria: { nombre: p.categoria_nombre },
  }));

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
