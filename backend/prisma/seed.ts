/**
 * Seed de base de datos - SaaS Abarrotes
 *
 * Crea datos iniciales:
 *  - 3 Planes de suscripción (Básico, Pro, Enterprise)
 *  - 1 Tienda demo
 *  - 1 Usuario admin (email: admin@demo.com / password: admin123)
 *  - Categorías de ejemplo
 *  - Productos de ejemplo
 *  - 1 Cliente de ejemplo
 *  - 1 Proveedor de ejemplo
 *
 * Ejecutar: npm run seed
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // =========================================================
  // 1. PLANES DE SUSCRIPCIÓN
  // =========================================================
  console.log("📦 Creando planes...");

  const planBasico = await prisma.plan.upsert({
    where: { nombre: "Básico" },
    update: {},
    create: {
      nombre: "Básico",
      precio_mensual: 29900, // $299 MXN
      max_usuarios: 2,
      max_productos: 200,
      max_clientes: 100,
      generar_reportes: false,
      soporte_email: true,
    },
  });

  const planPro = await prisma.plan.upsert({
    where: { nombre: "Pro" },
    update: {},
    create: {
      nombre: "Pro",
      precio_mensual: 59900, // $599 MXN
      max_usuarios: 5,
      max_productos: 2000,
      max_clientes: 1000,
      generar_reportes: true,
      soporte_email: true,
    },
  });

  const planEnterprise = await prisma.plan.upsert({
    where: { nombre: "Enterprise" },
    update: {},
    create: {
      nombre: "Enterprise",
      precio_mensual: 149900, // $1,499 MXN
      max_usuarios: 999,
      max_productos: 999999,
      max_clientes: 999999,
      generar_reportes: true,
      soporte_email: true,
    },
  });

  console.log(`   ✓ ${planBasico.nombre} ($${planBasico.precio_mensual / 100})`);
  console.log(`   ✓ ${planPro.nombre} ($${planPro.precio_mensual / 100})`);
  console.log(`   ✓ ${planEnterprise.nombre} ($${planEnterprise.precio_mensual / 100})\n`);

  // =========================================================
  // 2. TIENDA DEMO
  // =========================================================
  console.log("🏪 Creando tienda demo...");

  const tiendaExistente = await prisma.tienda.findUnique({
    where: { rfc: "DEMO010101ABC" },
  });

  const tienda =
    tiendaExistente ??
    (await prisma.tienda.create({
      data: {
        nombre: "Abarrotes Don Pepe (DEMO)",
        rfc: "DEMO010101ABC",
        domicilio: "Av. Siempre Viva 742, Col. Centro, CDMX",
        telefonos: "55-1234-5678",
        email: "contacto@donpepe.demo",
        plan_id: planPro.id,
        activa: true,
      },
    }));

  console.log(`   ✓ Tienda: ${tienda.nombre} (id: ${tienda.id})\n`);

  // =========================================================
  // 3. USUARIO ADMIN
  // =========================================================
  console.log("👤 Creando usuario admin...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const usuarioAdmin = await prisma.usuario.upsert({
    where: {
      email_tienda_id: {
        email: "admin@demo.com",
        tienda_id: tienda.id,
      },
    },
    update: {},
    create: {
      email: "admin@demo.com",
      password: passwordHash,
      nombre: "Pepe",
      apellido: "Administrador",
      tienda_id: tienda.id,
      rol: "admin",
      activo: true,
    },
  });

  console.log(`   ✓ Admin: ${usuarioAdmin.email} (password: admin123)\n`);

  // =========================================================
  // 4. CATEGORÍAS
  // =========================================================
  console.log("📂 Creando categorías...");

  const categoriasData = [
    { nombre: "Abarrotes", descripcion: "Productos básicos de despensa" },
    { nombre: "Bebidas", descripcion: "Refrescos, aguas, jugos" },
    { nombre: "Lácteos", descripcion: "Leche, quesos, yogurt" },
    { nombre: "Limpieza", descripcion: "Detergentes, jabones, artículos de aseo" },
    { nombre: "Dulces y Botanas", descripcion: "Dulces, frituras, chocolates" },
  ];

  const categorias: Record<string, string> = {};
  for (const cat of categoriasData) {
    const created = await prisma.categoria.upsert({
      where: { tienda_id_nombre: { tienda_id: tienda.id, nombre: cat.nombre } },
      update: {},
      create: { ...cat, tienda_id: tienda.id },
    });
    categorias[cat.nombre] = created.id;
    console.log(`   ✓ ${created.nombre}`);
  }
  console.log();

  // =========================================================
  // 5. PRODUCTOS
  // =========================================================
  console.log("🛒 Creando productos...");

  const productosData = [
    // Abarrotes
    { codigo: "7501000100015", nombre: "Frijol Negro 1kg", costo: 2500, venta: 3500, stock: 50, cat: "Abarrotes" },
    { codigo: "7501000100022", nombre: "Arroz Morelos 1kg", costo: 2200, venta: 3000, stock: 40, cat: "Abarrotes" },
    { codigo: "7501000100039", nombre: "Azúcar Estándar 1kg", costo: 2800, venta: 3800, stock: 60, cat: "Abarrotes" },
    { codigo: "7501000100046", nombre: "Aceite Vegetal 1L", costo: 3500, venta: 4900, stock: 30, cat: "Abarrotes" },
    { codigo: "7501000100053", nombre: "Sal Refinada 1kg", costo: 900, venta: 1500, stock: 80, cat: "Abarrotes" },

    // Bebidas
    { codigo: "7501055300011", nombre: "Coca-Cola 600ml", costo: 1200, venta: 1800, stock: 100, cat: "Bebidas" },
    { codigo: "7501055300028", nombre: "Sprite 600ml", costo: 1200, venta: 1800, stock: 80, cat: "Bebidas" },
    { codigo: "7501055300035", nombre: "Agua Ciel 1.5L", costo: 800, venta: 1500, stock: 120, cat: "Bebidas" },

    // Lácteos
    { codigo: "7501020500015", nombre: "Leche Lala 1L", costo: 2200, venta: 2800, stock: 45, cat: "Lácteos" },
    { codigo: "7501020500022", nombre: "Queso Oaxaca 500g", costo: 6500, venta: 8900, stock: 15, cat: "Lácteos" },

    // Limpieza
    { codigo: "7501025400015", nombre: "Fabuloso 1L", costo: 2500, venta: 3500, stock: 25, cat: "Limpieza" },
    { codigo: "7501025400022", nombre: "Jabón Zote 400g", costo: 1800, venta: 2500, stock: 40, cat: "Limpieza" },

    // Dulces y Botanas
    { codigo: "7501030500015", nombre: "Sabritas Original 45g", costo: 900, venta: 1500, stock: 60, cat: "Dulces y Botanas" },
    { codigo: "7501030500022", nombre: "Chokis 120g", costo: 1200, venta: 1900, stock: 35, cat: "Dulces y Botanas" },
    { codigo: "7501030500039", nombre: "Carlos V 18g", costo: 500, venta: 900, stock: 100, cat: "Dulces y Botanas" },
  ];

  for (const p of productosData) {
    await prisma.producto.upsert({
      where: { tienda_id_codigo: { tienda_id: tienda.id, codigo: p.codigo } },
      update: {},
      create: {
        tienda_id: tienda.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precio_costo: p.costo,
        precio_venta: p.venta,
        stock_actual: p.stock,
        stock_minimo: 5,
        categoria_id: categorias[p.cat],
        unidad_medida: "pieza",
      },
    });
    console.log(`   ✓ ${p.nombre} - $${(p.venta / 100).toFixed(2)}`);
  }
  console.log();

  // =========================================================
  // 6. CLIENTE DE EJEMPLO
  // =========================================================
  console.log("👥 Creando cliente demo...");

  const cliente = await prisma.cliente.create({
    data: {
      tienda_id: tienda.id,
      nombre: "María García",
      telefono: "55-9876-5432",
      email: "maria.garcia@example.com",
      domicilio: "Calle Falsa 123",
      tipo: "frecuente",
      credito_limite: 0,
    },
  });
  console.log(`   ✓ ${cliente.nombre}\n`);

  // =========================================================
  // 7. PROVEEDOR DE EJEMPLO
  // =========================================================
  console.log("🚚 Creando proveedor demo...");

  const proveedor = await prisma.proveedor.create({
    data: {
      tienda_id: tienda.id,
      nombre: "Distribuidora La Merced",
      contacto: "Juan Pérez",
      telefono: "55-1111-2222",
      email: "ventas@lamerced.demo",
      dias_credito: 15,
    },
  });
  console.log(`   ✓ ${proveedor.nombre}\n`);

  // =========================================================
  console.log("✅ Seed completado exitosamente.\n");
  console.log("📝 Credenciales demo:");
  console.log("   Email:    admin@demo.com");
  console.log("   Password: admin123");
  console.log(`   Tienda:   ${tienda.nombre} (id: ${tienda.id})\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
