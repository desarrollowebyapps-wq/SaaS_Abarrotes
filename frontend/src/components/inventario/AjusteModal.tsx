import { useState } from "react";
import { X } from "lucide-react";
import type { Producto } from "../../api/inventario";

interface Props {
  producto: Producto;
  onClose: () => void;
  onConfirm: (nueva_cantidad: number, motivo: string, notas?: string) => Promise<void>;
}

const MOTIVOS = [
  { value: "error_conteo",  label: "Error de conteo" },
  { value: "merma",         label: "Merma / caducidad" },
  { value: "robo",          label: "Robo / pérdida" },
  { value: "entrada",       label: "Entrada de mercancía" },
  { value: "devolucion",    label: "Devolución a proveedor" },
  { value: "otro",          label: "Otro" },
];

export default function AjusteModal({ producto, onClose, onConfirm }: Props) {
  const [nueva_cantidad, setNuevaCantidad] = useState(producto.stock_actual);
  const [motivo, setMotivo] = useState("error_conteo");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const diferencia = nueva_cantidad - producto.stock_actual;
  const sinCambio  = diferencia === 0;

  async function handleConfirm() {
    if (nueva_cantidad < 0) { setError("La cantidad no puede ser negativa"); return; }
    setGuardando(true);
    setError("");
    try {
      await onConfirm(nueva_cantidad, motivo, notas || undefined);
      onClose();
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { error?: string } } };
      setError(axErr?.response?.data?.error ?? "Error al guardar ajuste");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ajuste de stock</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{producto.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Stock actual</span>
            <span className="text-sm font-semibold text-gray-900">
              {producto.stock_actual} {producto.unidad_medida}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nueva cantidad *</label>
            <input
              type="number"
              min={0}
              value={nueva_cantidad}
              onChange={(e) => setNuevaCantidad(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {!sinCambio && (
              <p className={`text-xs mt-1 font-medium ${diferencia > 0 ? "text-green-600" : "text-red-500"}`}>
                {diferencia > 0 ? "+" : ""}{diferencia} unidades
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Motivo *</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Detalles adicionales..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={guardando || sinCambio}
            className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {guardando ? "Guardando..." : "Aplicar ajuste"}
          </button>
        </div>
      </div>
    </div>
  );
}
