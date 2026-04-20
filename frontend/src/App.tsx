import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { getMe } from "./api/auth";

// Lazy loading — cada página carga su chunk solo cuando se navega a ella
const Login     = lazy(() => import("./pages/Login"));
const Register  = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventario = lazy(() => import("./pages/Inventario"));
const POS       = lazy(() => import("./pages/POS"));
const Reportes  = lazy(() => import("./pages/Reportes"));
const Usuarios  = lazy(() => import("./pages/Usuarios"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Cargando...
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { token, setUsuario, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    getMe()
      .then((data) => setUsuario({ id: data.id, nombre: data.nombre, apellido: data.apellido, email: data.email, rol: data.rol }, data.tienda))
      .catch(() => logout());
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/inventario" element={<AppLayout><Inventario /></AppLayout>} />
        <Route path="/pos"       element={<AppLayout><POS /></AppLayout>} />
        <Route path="/reportes"  element={<AppLayout><Reportes /></AppLayout>} />
        <Route path="/usuarios"  element={<AppLayout><Usuarios /></AppLayout>} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
