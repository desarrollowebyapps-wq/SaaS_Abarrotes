import { prisma } from "../../lib/prisma.js";

export interface ClienteDTO {
  nombre: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  tipo?: string;
  credito_limite?: number;
}

export async function getClientes(
  tiendaId: string,
  params: { busqueda?: string; tipo?: string; pagina?: number; limite?: number } = {}
) {
  const { busqueda, tipo, pagina = 1, limite = 20 } = params;

  const where: Record<string, unknown> = { tienda_id: tiendaId };

  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: "insensitive" } },
      { telefono: { contains: busqueda } },
      { email: { contains: busqueda, mode: "insensitive" } },
    ];
  }

  if (tipo) where.tipo = tipo;

  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (pagina - 1) * limite,
      take: limite,
      include: {
        _count: { select: { ventas: true } },
      },
    }),
  ]);

  return { clientes, total, pagina, paginas: Math.ceil(total / limite) };
}

export async function getClienteById(tiendaId: string, id: string) {
  const cliente = await prisma.cliente.findFirst({
    where: { id, tienda_id: tiendaId },
    include: {
      ventas: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          numero_ticket: true,
          total_neto: true,
          metodo_pago: true,
          estado: true,
          createdAt: true,
        },
      },
      _count: { select: { ventas: true } },
    },
  });

  if (!cliente) throw new Error("Cliente no encontrado");
  return cliente;
}

export async function createCliente(tiendaId: string, dto: ClienteDTO) {
  return prisma.cliente.create({
    data: { tienda_id: tiendaId, ...dto },
  });
}

export async function updateCliente(tiendaId: string, id: string, dto: Partial<ClienteDTO>) {
  const existe = await prisma.cliente.findFirst({ where: { id, tienda_id: tiendaId } });
  if (!existe) throw new Error("Cliente no encontrado");

  return prisma.cliente.update({ where: { id }, data: dto });
}

export async function deleteCliente(tiendaId: string, id: string) {
  const existe = await prisma.cliente.findFirst({ where: { id, tienda_id: tiendaId } });
  if (!existe) throw new Error("Cliente no encontrado");

  return prisma.cliente.delete({ where: { id } });
}
