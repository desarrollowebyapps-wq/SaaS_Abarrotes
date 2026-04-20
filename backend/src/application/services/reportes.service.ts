import { prisma } from "../../lib/prisma.js";

export async function getReporteVentas(
  tiendaId: string,
  desde: string,
  hasta: string
) {
  const inicio = new Date(desde);
  const fin = new Date(hasta);
  fin.setHours(23, 59, 59, 999);

  const ventas = await prisma.venta.findMany({
    where: {
      tienda_id: tiendaId,
      estado: "completada",
      createdAt: { gte: inicio, lte: fin },
    },
    include: {
      detalles: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalIngresos = ventas.reduce((a, v) => a + v.total_neto, 0);
  const totalIva = ventas.reduce((a, v) => a + v.impuesto, 0);
  const totalDescuentos = ventas.reduce((a, v) => a + v.descuento, 0);

  // Agrupar por método de pago
  const porMetodo: Record<string, { count: number; total: number }> = {};
  for (const v of ventas) {
    if (!porMetodo[v.metodo_pago]) porMetodo[v.metodo_pago] = { count: 0, total: 0 };
    porMetodo[v.metodo_pago].count += 1;
    porMetodo[v.metodo_pago].total += v.total_neto;
  }

  return {
    resumen: {
      total_ventas: ventas.length,
      total_ingresos: totalIngresos,
      total_iva: totalIva,
      total_descuentos: totalDescuentos,
      ticket_promedio: ventas.length > 0 ? Math.round(totalIngresos / ventas.length) : 0,
    },
    por_metodo: porMetodo,
    ventas,
  };
}

export async function getReporteInventario(tiendaId: string) {
  const productos = await prisma.producto.findMany({
    where: { tienda_id: tiendaId, activo: true },
    include: { categoria: { select: { nombre: true } } },
    orderBy: { nombre: "asc" },
  });

  const valorCosto = productos.reduce((a, p) => a + p.precio_costo * p.stock_actual, 0);
  const valorVenta = productos.reduce((a, p) => a + p.precio_venta * p.stock_actual, 0);
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo);
  const sinStock = productos.filter((p) => p.stock_actual === 0);

  return {
    resumen: {
      total_productos: productos.length,
      valor_costo: valorCosto,
      valor_venta: valorVenta,
      ganancia_potencial: valorVenta - valorCosto,
      stock_bajo: stockBajo.length,
      sin_stock: sinStock.length,
    },
    productos,
  };
}

export async function getTopProductos(
  tiendaId: string,
  desde: string,
  hasta: string
) {
  const inicio = new Date(desde);
  const fin = new Date(hasta + "T23:59:59");

  // Agrupación directa en la BD — evita cargar todos los registros en memoria
  type TopRow = {
    id: string;
    nombre: string;
    categoria: string;
    cantidad: bigint;
    ingresos: bigint;
  };

  const rows = await prisma.$queryRaw<TopRow[]>`
    SELECT
      p.id,
      p.nombre,
      c.nombre AS categoria,
      SUM(dv.cantidad)::bigint  AS cantidad,
      SUM(dv.subtotal)::bigint  AS ingresos
    FROM "DetalleVenta" dv
    JOIN "Venta"    v ON v.id = dv.venta_id
    JOIN "Producto" p ON p.id = dv.producto_id
    JOIN "Categoria" c ON c.id = p.categoria_id
    WHERE v.tienda_id = ${tiendaId}
      AND v.estado    = 'completada'
      AND v."createdAt" >= ${inicio}
      AND v."createdAt" <= ${fin}
    GROUP BY p.id, p.nombre, c.nombre
    ORDER BY cantidad DESC
    LIMIT 10
  `;

  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    cantidad: Number(r.cantidad),
    ingresos: Number(r.ingresos),
  }));
}
