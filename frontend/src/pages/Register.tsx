import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import * as authApi from "../api/auth";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    tienda_nombre: "",
    tienda_rfc: "",
    tienda_domicilio: "",
    tienda_email: "",
    tienda_telefonos: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.register(form);
      setAuth(data.token, data.usuario, data.tienda);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al registrarse";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const field = (
    name: keyof typeof form,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={!["apellido", "tienda_telefonos"].includes(name)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 mt-1">Registra tu tienda en Abarrotes SaaS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Datos del administrador
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("nombre", "Nombre")}
            {field("apellido", "Apellido (opcional)")}
          </div>
          {field("email", "Correo electrónico", "email", "tu@correo.com")}
          {field("password", "Contraseña", "password", "Mínimo 8 caracteres")}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">
            Datos de la tienda
          </p>
          {field("tienda_nombre", "Nombre de la tienda", "text", "Abarrotes El Sol")}
          {field("tienda_rfc", "RFC", "text", "XAXX010101000")}
          {field("tienda_domicilio", "Domicilio", "text", "Calle, Colonia, Ciudad")}
          {field("tienda_email", "Correo de la tienda", "email")}
          {field("tienda_telefonos", "Teléfono (opcional)", "tel")}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors mt-2"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
