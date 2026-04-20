import { prisma } from "../../lib/prisma.js";

// ── Categorías ─────────────────────────────────────────────

export async function getCategorias(tiendaId: string) {
  return prisma.categoria.findMany({
    where: { tienda_id: tiendaId },
    orderBy: { nombre: "asc" },
  });
}

export async function createCategoria(tiendaId: string, nombre: string, descripcion?: string) {
  return prisma.categoria.create({
    data: { tienda_id: tiendaId, nombre, descripcion },
  });
}

// ── Productos ──────────────────────────────────────────────

export interface ProductoFiltros {
  busqueda?: string;
  categoria_id?: string;
  stock_bajo?: boolean;
  pagina?: number;
  limite?: number;
}

export async function getProductos(tiendaId: string, filtros: ProductoFiltros = {}) {
  const { busqueda, categoria_id, stock_bajo, pagina = 1, limite = 20 } = filtros;

  const where: Record<string, unknown> = {
    tienda_id: tiendaId,
    activo: true,
  };

  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: "insensitive" } },
      { codigo: { contains: busqueda, mode: "insensitive" } },
    ];
  }

  if (categoria_id) where.categoria_id = categoria_id;

  if (stock_bajo) {
    where.stock_actual = { lte: prisma.producto.fields.stock_minimo };
  }

  const [total, productos] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
  ]);

  return { productos, total, pagina, limite, paginas: Math.ceil(total / limite) };
}

export interface CreateProductoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_costo: number;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
  categoria_id: string;
  unidad_medida?: string;
}

export async function createProducto(tiendaId: string, dto: CreateProductoDTO) {
  const existe = await prisma.producto.findUnique({
    where: { tienda_id_codigo: { tienda_id: tiendaId, codigo: dto.codigo } },
  });
  if (existe) throw new Error("Ya existe un producto con ese código");

  return prisma.producto.create({
    data: { tienda_id: tiendaId, ...dto },
    include: { categoria: { select: { id: true, nombre: true } } },
  });
}

export async function updateProducto(
  tiendaId: string,
  id: string,
  dto: Partial<CreateProductoDTO>
) {
  const producto = await prisma.producto.findFirst({ where: { id, tienda_id: tiendaId } });
  if (!producto) throw new Error("Producto no encontrado");

  return prisma.producto.update({
    where: { id },
    data: dto,
    include: { categoria: { select: { id: true, nombre: true } } },
  });
}

export async function deleteProducto(tiendaId: string, id: string) {
  const producto = await prisma.producto.findFirst({ where: { id, tienda_id: tiendaId } });
  if (!producto) throw new Error("Producto no encontrado");

  return prisma.producto.update({ where: { id }, data: { activo: false } });
}

export interface MovimientosFiltros {
  producto_id?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

export async function getMovimientos(tiendaId: string, filtros: MovimientosFiltros = {}) {
  const { producto_id, tipo, desde, hasta, pagina = 1, limite = 30 } = filtros;

  const where: Record<string, unknown> = {
    producto: { tienda_id: tiendaId },
  };

  if (producto_id) where.producto_id = producto_id;
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.createdAt = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
    };
  }

  const [total, movimientos] = await Promise.all([
    prisma.movimientoInventario.count({ where }),
    prisma.movimientoInventario.findMany({
      where,
      include: { producto: { select: { nombre: true, codigo: true, unidad_medida: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
  ]);

  return { movimientos, total, pagina, limite, paginas: Math.ceil(total / limite) };
}

export interface AjusteStockDTO {
  nueva_cantidad: number;
  motivo: string; // merma, robo, error_conteo, entrada, otro
  notas?: string;
}

export async function ajustarStock(tiendaId: string, productoId: string, dto: AjusteStockDTO) {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, tienda_id: tiendaId, activo: true },
  });
  if (!producto) throw new Error("Producto no encontrado");

  if (dto.nueva_cantidad < 0) throw new Error("La cantidad no puede ser negativa");

  const diferencia = dto.nueva_cantidad - producto.stock_actual;

  return prisma.$transaction(async (tx) => {
    const actualizado = await tx.producto.update({
      where: { id: productoId },
      data: { stock_actual: dto.nueva_cantidad },
      include: { categoria: { select: { id: true, nombre: true } } },
    });

    await tx.movimientoInventario.create({
      data: {
        producto_id: productoId,
        tipo: "ajuste",
        cantidad: diferencia,
        motivo: dto.motivo,
        referencia: dto.notas ?? null,
      },
    });

    return actualizado;
  });
}
