import { useEffect, useState } from "react";
import { X, ShoppingBag } from "lucide-react";
import * as api from "../../api/clientes";
import type { ClienteDetalle as IClienteDetalle } from "../../api/clientes";

function fmt(centavos: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    centavos / 100
  );
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const TIPO_BADGE: Record<string, string> = {
  normal: "bg-gray-100 text-gray-600",
  frecuente: "bg-blue-50 text-blue-700",
  credito: "bg-purple-50 text-purple-700",
};

interface Props {
  clienteId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function ClienteDetalle({ clienteId, onClose, onEdit }: Props) {
  const [cliente, setCliente] = useState<IClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCliente(clienteId)
      .then(setCliente)
      .finally(() => setLoading(false));
  }, [clienteId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!cliente) return null;

  const totalComprado = cliente.ventas.reduce((a, v) => a + v.total_neto, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{cliente.nombre}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${TIPO_BADGE[cliente.tipo]}`}>
              {cliente.tipo}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-4 space-y-2 border-b border-gray-100">
          {cliente.telefono && (
            <p className="text-sm text-gray-600"><span className="text-gray-400">Tel:</span> {cliente.telefono}</p>
          )}
          {cliente.email && (
            <p className="text-sm text-gray-600"><span className="text-gray-400">Email:</span> {cliente.email}</p>
          )}
          {cliente.domicilio && (
            <p className="text-sm text-gray-600"><span className="text-gray-400">Domicilio:</span> {cliente.domicilio}</p>
          )}
          {cliente.tipo === "credito" && (
            <div className="flex gap-4 mt-3">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Límite crédito</p>
                <p className="text-sm font-semibold text-gray-900">{fmt(cliente.credito_limite)}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Usado</p>
                <p className="text-sm font-semibold text-red-600">{fmt(cliente.credito_usado)}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Disponible</p>
                <p className="text-sm font-semibold text-green-600">
                  {fmt(cliente.credito_limite - cliente.credito_usado)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-6 py-3 flex gap-6 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-xs text-gray-400">Total compras</p>
            <p className="text-sm font-semibold text-gray-900">{cliente._count?.ventas ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Monto total</p>
            <p className="text-sm font-semibold text-gray-900">{fmt(totalComprado)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cliente desde</p>
            <p className="text-sm font-semibold text-gray-900">{fmtFecha(cliente.createdAt)}</p>
          </div>
        </div>

        {/* Historial */}
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Últimas compras
          </h3>
          {cliente.ventas.length === 0 ? (
            <div className="text-center py-6 text-gray-300">
              <ShoppingBag size={28} className="mx-auto mb-2" />
              <p className="text-sm">Sin compras registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cliente.ventas.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.numero_ticket}</p>
                    <p className="text-xs text-gray-400 capitalize">{v.metodo_pago} · {fmtFecha(v.createdAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{fmt(v.total_neto)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
