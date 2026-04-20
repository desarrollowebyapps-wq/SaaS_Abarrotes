import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

export interface CrearUsuarioDTO {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: "vendedor" | "encargado";
}

export interface ActualizarUsuarioDTO {
  nombre?: string;
  apellido?: string;
  rol?: "vendedor" | "encargado";
  password?: string;
}

export async function listarUsuarios(tiendaId: string) {
  return prisma.usuario.findMany({
    where: { tienda_id: tiendaId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
      ultimo_login: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function crearUsuario(tiendaId: string, dto: CrearUsuarioDTO) {
  // Verificar que el email no esté en uso en esta tienda
  const existente = await prisma.usuario.findUnique({
    where: { email_tienda_id: { email: dto.email, tienda_id: tiendaId } },
  });
  if (existente) {
    throw new Error("Ya existe un usuario con ese correo en esta tienda");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  return prisma.usuario.create({
    data: {
      email: dto.email,
      password: hashedPassword,
      nombre: dto.nombre,
      apellido: dto.apellido,
      rol: dto.rol,
      tienda_id: tiendaId,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
  });
}

export async function actualizarUsuario(
  tiendaId: string,
  usuarioId: string,
  dto: ActualizarUsuarioDTO
) {
  // Verificar que el usuario pertenece a la tienda
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, tienda_id: tiendaId },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  const data: Record<string, unknown> = {};
  if (dto.nombre !== undefined) data.nombre = dto.nombre;
  if (dto.apellido !== undefined) data.apellido = dto.apellido;
  if (dto.rol !== undefined) data.rol = dto.rol;
  if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

  return prisma.usuario.update({
    where: { id: usuarioId },
    data,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      activo: true,
    },
  });
}

export async function toggleActivo(
  tiendaId: string,
  usuarioId: string,
  solicitanteId: string
) {
  if (usuarioId === solicitanteId) {
    throw new Error("No puedes desactivarte a ti mismo");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, tienda_id: tiendaId },
  });
  if (!usuario) throw new Error("Usuario no encontrado");
  if (usuario.rol === "admin") throw new Error("No se puede desactivar al admin");

  return prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: !usuario.activo },
    select: { id: true, activo: true },
  });
}
