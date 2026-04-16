import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ShoppingCart, TrendingUp, Package, Users, AlertTriangle, RefreshCw,
} from "lucide-react";
import { getDashboard } from "../api/dashboard";
import type { DashboardData } from "../api/dashboard";

function fmt(centavos: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    centavos / 100
  );
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const METODO_BADGE: Record<string, string> = {
  efectivo: "bg-green-50 text-green-700",
  tarjeta: "bg-blue-50 text-blue-700",
  transferencia: "bg-purple-50 text-purple-700",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando dashboard...
      </div>
    );
  }

  const { kpis, ultimas_ventas, productos_stock_bajo, grafica_7dias } = data;

  const kpiCards = [
    {
      label: "Ventas hoy",
      value: kpis.ventas_hoy.toString(),
      sub: fmt(kpis.ingresos_hoy),
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Ingresos del mes",
      value: fmt(kpis.ingresos_mes),
      sub: "mes actual",
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Productos",
      value: kpis.total_productos.toString(),
      sub: kpis.stock_bajo > 0 ? `${kpis.stock_bajo} con stock bajo` : "todos en stock",
      icon: Package,
      color: kpis.stock_bajo > 0 ? "text-orange-600 bg-orange-50" : "text-purple-600 bg-purple-50",
    },
    {
      label: "Clientes",
      value: kpis.total_clientes.toString(),
      sub: "registrados",
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{card.label}</p>
              <span className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={16} />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfica + Últimas ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfica 7 días */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Ingresos últimos 7 días</h2>
          {grafica_7dias.every((d) => d.ingresos === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Sin ventas en los últimos 7 días
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={grafica_7dias} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(value: number) => [fmt(value), "Ingresos"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Últimas ventas</h2>
          {ultimas_ventas.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Sin ventas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {ultimas_ventas.map((v) => (
                <div key={v.id} className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {v.cliente?.nombre ?? "Cliente general"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${METODO_BADGE[v.metodo_pago] ?? "bg-gray-100 text-gray-600"}`}>
                        {v.metodo_pago}
                      </span>
                      <span className="text-xs text-gray-400">{fmtHora(v.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 ml-2 shrink-0">
                    {fmt(v.total_neto)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock bajo */}
      {productos_stock_bajo.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              Productos con stock bajo ({kpis.stock_bajo})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productos_stock_bajo.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{p.categoria.nombre}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-bold text-orange-600">
                    {p.stock_actual} {p.unidad_medida}
                  </p>
                  <p className="text-xs text-gray-400">mín. {p.stock_minimo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
