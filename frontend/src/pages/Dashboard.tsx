import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Productos", value: "—", sub: "en inventario" },
          { label: "Ventas hoy", value: "—", sub: "transacciones" },
          { label: "Clientes", value: "—", sub: "registrados" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <LayoutDashboard size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          Las métricas en tiempo real estarán disponibles próximamente.
        </p>
      </div>
    </div>
  );
}
