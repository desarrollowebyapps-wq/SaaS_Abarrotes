import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { TrendingUp, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import * as api from "../api/reportes";
import { formatPeso } from "../utils/format";

const fmt = formatPeso;

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function hace30() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

const TABS = ["Ventas", "Inventario", "Top productos"] as const;
type Tab = typeof TABS[number];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Reportes() {
  const [tab, setTab] = useState<Tab>("Ventas");
  const [desde, setDesde] = useState(hace30());
  const [hasta, setHasta] = useState(hoy());
  const [loading, setLoading] = useState(false);

  const [ventasData, setVentasData] = useState<Record<string, unknown> | null>(null);
  const [inventarioData, setInventarioData] = useState<Record<string, unknown> | null>(null);
  const [topData, setTopData] = useState<unknown[] | null>(null);

  async function cargarVentas() {
    setLoading(true);
    try {
      const data = await api.getReporteVentas(desde, hasta);
      setVentasData(data);
    } finally { setLoading(false); }
  }

  async function cargarInventario() {
    setLoading(true);
    try {
      const data = await api.getReporteInventario();
      setInventarioData(data);
    } finally { setLoading(false); }
  }

  async function cargarTop() {
    setLoading(true);
    try {
      const data = await api.getTopProductos(desde, hasta);
      setTopData(data);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === "Ventas") cargarVentas();
    else if (tab === "Inventario") cargarInventario();
    else cargarTop();
  }, [tab, desde, hasta]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis de tu tienda</p>
        </div>

        {tab !== "Inventario" && (
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="text-gray-500">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : (
        <>
          {/* ── TAB VENTAS ── */}
          {tab === "Ventas" && ventasData && (
            <TabVentas data={ventasData} />
          )}

          {/* ── TAB INVENTARIO ── */}
          {tab === "Inventario" && inventarioData && (
            <TabInventario data={inventarioData} />
          )}

          {/* ── TAB TOP PRODUCTOS ── */}
          {tab === "Top productos" && topData && (
            <TabTop data={topData} colors={COLORS} />
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-componentes de tabs ────────────────────────────────

function TabVentas({ data }: { data: Record<string, unknown> }) {
  const r = data.resumen as {
    total_ventas: number;
    total_ingresos: number;
    total_iva: number;
    total_descuentos: number;
    ticket_promedio: number;
  };
  const porMetodo = data.por_metodo as Record<string, { count: number; total: number }>;
  const ventas = data.ventas as Array<{
    id: string; numero_ticket: string; total_neto: number;
    metodo_pago: string; createdAt: string;
    detalles: Array<{ producto: { nombre: string }; cantidad: number }>;
  }>;

  const metodoChart = Object.entries(porMetodo).map(([nombre, v]) => ({
    nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
    ingresos: v.total,
    ventas: v.count,
  }));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total ventas", value: r.total_ventas.toString(), icon: ShoppingBag },
          { label: "Ingresos", value: fmt(r.total_ingresos), icon: TrendingUp },
          { label: "IVA cobrado", value: fmt(r.total_iva), icon: TrendingUp },
          { label: "Descuentos", value: fmt(r.total_descuentos), icon: TrendingUp },
          { label: "Ticket prom.", value: fmt(r.ticket_promedio), icon: TrendingUp },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfica por método */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ingresos por método de pago</h3>
          {metodoChart.length === 0 ? (
            <p className="text-center text-gray-300 py-10 text-sm">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metodoChart} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v: number) => [fmt(v), "Ingresos"]} contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
                <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                  {metodoChart.map((_, i) => <Cell key={i} fill={["#3b82f6", "#10b981", "#8b5cf6"][i % 3]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabla de ventas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Detalle de ventas ({ventas.length})</h3>
          </div>
          <div className="overflow-y-auto max-h-52">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Ticket</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Fecha</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500">Método</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventas.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-xs">Sin ventas en este período</td></tr>
                ) : ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{v.numero_ticket}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(v.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 capitalize">{v.metodo_pago}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 text-xs">{fmt(v.total_neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabInventario({ data }: { data: Record<string, unknown> }) {
  const r = data.resumen as {
    total_productos: number;
    valor_costo: number;
    valor_venta: number;
    ganancia_potencial: number;
    stock_bajo: number;
    sin_stock: number;
  };
  const productos = data.productos as Array<{
    id: string; nombre: string; codigo: string;
    precio_costo: number; precio_venta: number;
    stock_actual: number; stock_minimo: number;
    unidad_medida: string;
    categoria: { nombre: string };
  }>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Valor en costo", value: fmt(r.valor_costo), color: "text-gray-900" },
          { label: "Valor en venta", value: fmt(r.valor_venta), color: "text-blue-600" },
          { label: "Ganancia potencial", value: fmt(r.ganancia_potencial), color: "text-green-600" },
          { label: "Total productos", value: r.total_productos.toString(), color: "text-gray-900" },
          { label: "Stock bajo", value: r.stock_bajo.toString(), color: r.stock_bajo > 0 ? "text-orange-600" : "text-gray-900" },
          { label: "Sin stock", value: r.sin_stock.toString(), color: r.sin_stock > 0 ? "text-red-600" : "text-gray-900" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Package size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Estado del inventario</h3>
        </div>
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500">Producto</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">Categoría</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">Stock</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">Costo unit.</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">Valor total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.stock_actual === 0 ? "bg-red-50" : p.stock_actual <= p.stock_minimo ? "bg-orange-50" : ""}`}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.codigo}</p>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{p.categoria.nombre}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-medium text-xs ${p.stock_actual === 0 ? "text-red-600" : p.stock_actual <= p.stock_minimo ? "text-orange-600" : "text-gray-900"}`}>
                      {p.stock_actual <= p.stock_minimo && p.stock_actual > 0 && <AlertTriangle size={11} className="inline mr-1" />}
                      {p.stock_actual} {p.unidad_medida}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{fmt(p.precio_costo)}</td>
                  <td className="px-4 py-2 text-right text-xs font-medium text-gray-900">{fmt(p.precio_costo * p.stock_actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabTop({ data, colors }: { data: unknown[]; colors: string[] }) {
  const items = data as Array<{ id: string; nombre: string; categoria: string; cantidad: number; ingresos: number }>;

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400 text-sm">
          Sin ventas en el período seleccionado
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Gráfica */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Unidades vendidas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={items} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {items.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla ranking */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Ranking de productos</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0`}
                    style={{ backgroundColor: colors[i % colors.length] }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.categoria}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{p.cantidad} uds</p>
                    <p className="text-xs text-gray-400">{fmt(p.ingresos)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
