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
  const fin = new Date(hasta);
  fin.setHours(23, 59, 59, 999);

  const detalles = await prisma.detalleVenta.findMany({
    where: {
      venta: {
        tienda_id: tiendaId,
        estado: "completada",
        createdAt: { gte: inicio, lte: fin },
      },
    },
    include: {
      producto: { select: { id: true, nombre: true, codigo: true, categoria: { select: { nombre: true } } } },
    },
  });

  // Agrupar por producto
  const map: Record<string, { nombre: string; categoria: string; cantidad: number; ingresos: number }> = {};

  for (const d of detalles) {
    const pid = d.producto_id;
    if (!map[pid]) {
      map[pid] = {
        nombre: d.producto.nombre,
        categoria: d.producto.categoria.nombre,
        cantidad: 0,
        ingresos: 0,
      };
    }
    map[pid].cantidad += d.cantidad;
    map[pid].ingresos += d.subtotal;
  }

  return Object.entries(map)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);
}
