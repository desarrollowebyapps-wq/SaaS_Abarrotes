import { useState } from "react";
import { X } from "lucide-react";
import * as api from "../../api/clientes";
import type { Cliente } from "../../api/clientes";

interface Props {
  cliente?: Cliente;
  onClose: () => void;
  onSaved: () => void;
}

const TIPOS = ["normal", "frecuente", "credito"];

export default function ClienteModal({ cliente, onClose, onSaved }: Props) {
  const editing = !!cliente;

  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    domicilio: cliente?.domicilio ?? "",
    tipo: cliente?.tipo ?? "normal",
    credito_limite: cliente ? cliente.credito_limite / 100 : 0,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        credito_limite: Math.round(Number(form.credito_limite) * 100),
      };

      if (editing) {
        await api.updateCliente(cliente.id, payload);
      } else {
        await api.createCliente(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al guardar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Nombre completo *" name="nombre" value={form.nombre} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} type="tel" />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
          </div>

          <Field label="Domicilio" name="domicilio" value={form.domicilio} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <Field
              label="Límite de crédito ($)"
              name="credito_limite"
              value={form.credito_limite}
              onChange={handleChange}
              type="number"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, name, value, onChange, type = "text",
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
