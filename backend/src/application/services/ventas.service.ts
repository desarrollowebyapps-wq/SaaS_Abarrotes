import { prisma } from "../../lib/prisma.js";

export interface ItemVenta {
  producto_id: string;
  cantidad: number;
  precio_unitario: number; // en centavos
  descuento_item?: number;
}

export interface CreateVentaDTO {
  items: ItemVenta[];
  descuento?: number;       // en centavos
  metodo_pago: string;
  cliente_id?: string;
  notas?: string;
}

function generarTicket(): string {
  const fecha = new Date();
  const fecha_str =
    fecha.getFullYear().toString().slice(2) +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0");
  const aleatorio = Math.floor(Math.random() * 9000 + 1000);
  return `T${fecha_str}-${aleatorio}`;
}

const IVA_RATE = 0.16;

export async function createVenta(tiendaId: string, usuarioId: string, dto: CreateVentaDTO) {
  if (!dto.items || dto.items.length === 0) {
    throw new Error("La venta debe tener al menos un producto");
  }

  // Verificar stock de todos los productos
  const productIds = dto.items.map((i) => i.producto_id);
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds }, tienda_id: tiendaId, activo: true },
  });

  if (productos.length !== productIds.length) {
    throw new Error("Uno o más productos no existen o no pertenecen a esta tienda");
  }

  for (const item of dto.items) {
    const producto = productos.find((p) => p.id === item.producto_id);
    if (!producto) throw new Error("Producto no encontrado");
    if (producto.stock_actual < item.cantidad) {
      throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_actual})`);
    }
  }

  // Calcular totales
  const total_bruto = dto.items.reduce(
    (acc, item) =>
      acc + item.precio_unitario * item.cantidad - (item.descuento_item ?? 0),
    0
  );
  const descuento = dto.descuento ?? 0;
  const base = total_bruto - descuento;
  const impuesto = Math.round(base * IVA_RATE);
  const total_neto = base + impuesto;

  const resultado = await prisma.$transaction(async (tx) => {
    // Crear venta
    const venta = await tx.venta.create({
      data: {
        tienda_id: tiendaId,
        usuario_id: usuarioId,
        cliente_id: dto.cliente_id ?? null,
        numero_ticket: generarTicket(),
        total_bruto,
        descuento,
        impuesto,
        total_neto,
        metodo_pago: dto.metodo_pago,
        notas: dto.notas,
        detalles: {
          create: dto.items.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento_item: item.descuento_item ?? 0,
            subtotal: item.precio_unitario * item.cantidad - (item.descuento_item ?? 0),
          })),
        },
      },
      include: {
        detalles: {
          include: { producto: { select: { nombre: true, codigo: true } } },
        },
        cliente: { select: { nombre: true } },
      },
    });

    // Descontar stock y registrar movimientos
    for (const item of dto.items) {
      await tx.producto.update({
        where: { id: item.producto_id },
        data: { stock_actual: { decrement: item.cantidad } },
      });

      await tx.movimientoInventario.create({
        data: {
          producto_id: item.producto_id,
          tipo: "salida",
          cantidad: item.cantidad,
          referencia: venta.id,
          motivo: `Venta ${venta.numero_ticket}`,
        },
      });
    }

    return venta;
  });

  return resultado;
}

export async function getVentas(tiendaId: string, params: { pagina?: number; limite?: number } = {}) {
  const { pagina = 1, limite = 30 } = params;

  const [total, ventas] = await Promise.all([
    prisma.venta.count({ where: { tienda_id: tiendaId } }),
    prisma.venta.findMany({
      where: { tienda_id: tiendaId },
      include: {
        detalles: { include: { producto: { select: { nombre: true } } } },
        cliente: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
  ]);

  return { ventas, total, pagina, paginas: Math.ceil(total / limite) };
}
