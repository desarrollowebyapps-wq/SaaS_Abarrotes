import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { rateLimit } from "express-rate-limit";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Seguridad ──────────────────────────────────────────────
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Parsers y logging ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rutas ──────────────────────────────────────────────────
import authRoutes from "./presentation/routes/auth.routes.js";
import inventarioRoutes from "./presentation/routes/inventario.routes.js";
import ventasRoutes from "./presentation/routes/ventas.routes.js";
import clientesRoutes from "./presentation/routes/clientes.routes.js";
import dashboardRoutes from "./presentation/routes/dashboard.routes.js";
import reportesRoutes from "./presentation/routes/reportes.routes.js";
import usuariosRoutes from "./presentation/routes/usuarios.routes.js";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/usuarios", usuariosRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ── Error handler ──────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

// ── Arranque ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV ?? "development"}`);
});
