import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import POS from "./pages/POS";
import Reportes from "./pages/Reportes";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { getMe } from "./api/auth";

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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/inventario" element={<AppLayout><Inventario /></AppLayout>} />
      <Route path="/pos" element={<AppLayout><POS /></AppLayout>} />
      <Route path="/reportes" element={<AppLayout><Reportes /></AppLayout>} />
<Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
