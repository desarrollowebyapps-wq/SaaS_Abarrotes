# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaaS grocery store management system (abarrotes) with multi-tenant architecture. Supports inventory, sales, purchases, customers, and suppliers per store tenant.

## Development Setup

### Prerequisites
- Docker (for PostgreSQL)
- Node.js

### Start the database
```bash
docker-compose up -d
```

### Backend
```bash
cd backend
npm install
npm run prisma:generate   # Generate Prisma client after schema changes
npm run seed              # Populate DB with demo data (admin@demo.com / admin123)
npm run dev               # Start dev server on port 3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Start Vite dev server on port 5173
```

## Common Commands

### Backend (`cd backend`)
| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Run Prisma migrations (dev) |
| `npm run migrate:deploy` | Deploy migrations (production) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio (DB UI) |
| `npm run db:reset` | Reset DB and re-run migrations |

### Frontend (`cd frontend`)
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check without emit |

## Architecture

### Tech Stack
- **Backend:** Express.js + TypeScript (ES modules), Prisma ORM, PostgreSQL 15
- **Frontend:** React 18 + TypeScript, Vite, Zustand (state), React Router 6, React Hook Form + Zod, Tailwind CSS, Recharts
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing

### Multi-Tenancy
All domain entities include a `tienda_id` foreign key to scope data per store. Authentication must always filter by the authenticated user's `tienda_id`. Cascade delete is configured on `Tienda`.

### Database Schema (Prisma)
Key models in `backend/prisma/schema.prisma`:
- `Tienda` — tenant (store), linked to a `Plan` (subscription tier)
- `Usuario` — users with roles: `admin`, `vendedor`, `encargado`; unique on `(email, tienda_id)`
- `Producto` — inventory items with `costo`, `precio_venta`, `stock_actual`, `stock_minimo`, `codigo` (barcode/SKU)
- `MovimientoInventario` — audit log for stock changes (entrada, salida, ajuste, devolución)
- `Venta` / `DetalleVenta` — sales transactions with IVA 16% support
- `OrdenCompra` / `DetalleCompra` — purchase orders
- `Cliente` — customers with credit limit
- `Proveedor` — suppliers

**All monetary values are stored in centavos (integer), not pesos.**

### Backend Source Layout
The `src/` directory (under `backend/`) is where API routes, controllers, middleware, and services belong. Prisma client is generated to `backend/generated/`.

### Environment Variables
Copy `backend/.env.example` to `backend/.env`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — auth tokens
- `PORT` (default 3000), `FRONTEND_URL` (default `http://localhost:5173`)
- `RESEND_API_KEY`, `STRIPE_KEY` — optional integrations (email, payments)
