import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  LogOut,
  Store,
} from "lucide-react";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventario", icon: Package, label: "Inventario" },
  { to: "/pos", icon: ShoppingCart, label: "Punto de Venta" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/reportes", icon: BarChart2, label: "Reportes" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { tienda, usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo / Tienda */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {tienda?.nombre ?? "Mi Tienda"}
              </p>
              <p className="text-xs text-gray-400">Abarrotes SaaS</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {usuario?.nombre}
              </p>
              <p className="text-xs text-gray-400 capitalize">{usuario?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="text-gray-400 hover:text-red-500 transition-colors ml-2"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
