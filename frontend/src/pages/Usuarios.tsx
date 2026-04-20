import { useEffect, useState } from "react";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  toggleActivo,
  Usuario,
} from "../api/usuarios";
import { useAuthStore } from "../store/authStore";
import { UserPlus, Pencil, PowerOff, Power, X, Check } from "lucide-react";

const ROL_LABEL: Record<string, string> = {
  admin: "Admin",
  encargado: "Encargado",
  vendedor: "Vendedor",
};

const ROL_COLOR: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  encargado: "bg-blue-100 text-blue-700",
  vendedor: "bg-gray-100 text-gray-600",
};

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  rol: "vendedor" as "vendedor" | "encargado",
};

export default function Usuarios() {
  const { usuario: yo } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      setUsuarios(await getUsuarios());
    } catch {
      setError("No se pudo cargar la lista de usuarios");
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setForm(emptyForm);
    setFormError("");
    setModalAbierto(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido ?? "",
      email: u.email,
      password: "",
      rol: u.rol as "vendedor" | "encargado",
    });
    setFormError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.email.trim()) {
      setFormError("Nombre y correo son obligatorios");
      return;
    }
    if (!editando && !form.password) {
      setFormError("La contraseña es obligatoria para usuarios nuevos");
      return;
    }

    setGuardando(true);
    setFormError("");
    try {
      if (editando) {
        const payload: Parameters<typeof actualizarUsuario>[1] = {
          nombre: form.nombre,
          apellido: form.apellido || undefined,
          rol: form.rol,
        };
        if (form.password) payload.password = form.password;
        const actualizado = await actualizarUsuario(editando.id, payload);
        setUsuarios((prev) =>
          prev.map((u) => (u.id === editando.id ? { ...u, ...actualizado } : u))
        );
      } else {
        const nuevo = await crearUsuario({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          apellido: form.apellido || undefined,
          rol: form.rol,
        });
        setUsuarios((prev) => [...prev, nuevo as Usuario]);
      }
      cerrarModal();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      // Axios error
      const axErr = e as { response?: { data?: { error?: string } } };
      setFormError(axErr?.response?.data?.error ?? msg);
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggle(u: Usuario) {
    try {
      const result = await toggleActivo(u.id);
      setUsuarios((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, activo: result.activo } : x))
      );
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { error?: string } } };
      alert(axErr?.response?.data?.error ?? "Error al cambiar estado");
    }
  }

  function formatFecha(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (yo?.rol !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los accesos a tu tienda</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-sm">{error}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Correo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Rol</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Último acceso
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {u.nombre} {u.apellido ?? ""}
                    {u.id === yo?.id && (
                      <span className="ml-2 text-xs text-gray-400">(tú)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        ROL_COLOR[u.rol] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROL_LABEL[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatFecha(u.ultimo_login)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        u.activo ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {u.activo ? <Check size={12} /> : <X size={12} />}
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {u.rol !== "admin" && (
                        <>
                          <button
                            onClick={() => abrirEditar(u)}
                            title="Editar"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleToggle(u)}
                            title={u.activo ? "Desactivar" : "Activar"}
                            className={`transition-colors ${
                              u.activo
                                ? "text-gray-400 hover:text-red-500"
                                : "text-gray-400 hover:text-green-600"
                            }`}
                          >
                            {u.activo ? <PowerOff size={15} /> : <Power size={15} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editando ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editando}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="vendedor@tienda.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {editando ? "Nueva contraseña (dejar en blanco para no cambiar)" : "Contraseña *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={form.rol}
                  onChange={(e) =>
                    setForm({ ...form, rol: e.target.value as "vendedor" | "encargado" })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="encargado">Encargado</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
