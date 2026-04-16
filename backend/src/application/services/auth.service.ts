import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  // Datos de la tienda nueva
  tienda_nombre: string;
  tienda_rfc: string;
  tienda_domicilio: string;
  tienda_email: string;
  tienda_telefonos?: string;
}

function signToken(userId: string, tiendaId: string, rol: string): string {
  return jwt.sign(
    { sub: userId, tienda_id: tiendaId, rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export async function login(dto: LoginDTO) {
  const usuario = await prisma.usuario.findFirst({
    where: { email: dto.email, activo: true },
    include: { tienda: { select: { id: true, nombre: true, activa: true } } },
  });

  if (!usuario) {
    throw new Error("Credenciales inválidas");
  }

  if (!usuario.tienda.activa) {
    throw new Error("Tienda suspendida, contacta a soporte");
  }

  const valid = await bcrypt.compare(dto.password, usuario.password);
  if (!valid) {
    throw new Error("Credenciales inválidas");
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimo_login: new Date() },
  });

  const token = signToken(usuario.id, usuario.tienda_id, usuario.rol);

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
    },
    tienda: {
      id: usuario.tienda.id,
      nombre: usuario.tienda.nombre,
    },
  };
}

export async function register(dto: RegisterDTO) {
  // Verificar que el RFC no esté ya registrado
  const tiendaExistente = await prisma.tienda.findUnique({
    where: { rfc: dto.tienda_rfc },
  });
  if (tiendaExistente) {
    throw new Error("Ya existe una tienda registrada con ese RFC");
  }

  // Obtener plan básico por defecto
  const planBasico = await prisma.plan.findFirst({
    where: { nombre: "Básico" },
  });
  if (!planBasico) {
    throw new Error("No hay planes disponibles, contacta a soporte");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // Crear tienda + admin en una transacción
  const result = await prisma.$transaction(async (tx) => {
    const tienda = await tx.tienda.create({
      data: {
        nombre: dto.tienda_nombre,
        rfc: dto.tienda_rfc,
        domicilio: dto.tienda_domicilio,
        email: dto.tienda_email,
        telefonos: dto.tienda_telefonos,
        plan_id: planBasico.id,
      },
    });

    const usuario = await tx.usuario.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nombre: dto.nombre,
        apellido: dto.apellido,
        rol: "admin",
        tienda_id: tienda.id,
      },
    });

    return { tienda, usuario };
  });

  const token = signToken(result.usuario.id, result.tienda.id, "admin");

  return {
    token,
    usuario: {
      id: result.usuario.id,
      nombre: result.usuario.nombre,
      email: result.usuario.email,
      rol: result.usuario.rol,
    },
    tienda: {
      id: result.tienda.id,
      nombre: result.tienda.nombre,
    },
  };
}

export async function me(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      tienda: { select: { id: true, nombre: true, plan: { select: { nombre: true } } } },
    },
  });

  if (!usuario) throw new Error("Usuario no encontrado");

  return usuario;
}
