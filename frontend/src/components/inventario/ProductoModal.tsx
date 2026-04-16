import { useState } from "react";
import { X } from "lucide-react";
import * as api from "../../api/inventario";
import type { Producto, Categoria } from "../../api/inventario";

interface Props {
  producto?: Producto;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}

const UNIDADES = ["pieza", "kg", "litro", "caja", "bolsa", "paquete", "gramo", "ml"];

export default function ProductoModal({ producto, categorias, onClose, onSaved }: Props) {
  const editing = !!producto;

  const [form, setForm] = useState({
    codigo: producto?.codigo ?? "",
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio_costo: producto ? producto.precio_costo / 100 : 0,
    precio_venta: producto ? producto.precio_venta / 100 : 0,
    stock_actual: producto?.stock_actual ?? 0,
    stock_minimo: producto?.stock_minimo ?? 5,
    categoria_id: producto?.categoria.id ?? "",
    unidad_medida: producto?.unidad_medida ?? "pieza",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        precio_costo: Math.round(Number(form.precio_costo) * 100),
        precio_venta: Math.round(Number(form.precio_venta) * 100),
        stock_actual: Number(form.stock_actual),
        stock_minimo: Number(form.stock_minimo),
      };

      if (editing) {
        await api.updateProducto(producto.id, payload);
      } else {
        await api.createProducto(payload);
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Código / SKU" name="codigo" value={form.codigo} onChange={handleChange} required />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
              <select
                name="unidad_medida"
                value={form.unidad_medida}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <Field label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
            <select
              name="categoria_id"
              value={form.categoria_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio costo ($)" name="precio_costo" type="number" value={form.precio_costo} onChange={handleChange} required />
            <Field label="Precio venta ($)" name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock actual" name="stock_actual" type="number" value={form.stock_actual} onChange={handleChange} />
            <Field label="Stock mínimo" name="stock_minimo" type="number" value={form.stock_minimo} onChange={handleChange} />
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
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, name, value, onChange, type = "text", required = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
