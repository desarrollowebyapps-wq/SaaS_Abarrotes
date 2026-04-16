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
