import { useEffect, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import * as api from "../api/clientes";
import type { Cliente } from "../api/clientes";
import ClienteModal from "../components/clientes/ClienteModal";
import ClienteDetalle from "../components/clientes/ClienteDetalle";

const TIPO_BADGE: Record<string, string> = {
  normal: "bg-gray-100 text-gray-600",
  frecuente: "bg-blue-50 text-blue-700",
  credito: "bg-purple-50 text-purple-700",
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{ open: boolean; cliente?: Cliente }>({ open: false });
  const [detalle, setDetalle] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    try {
      const res = await api.getClientes({
        busqueda: busqueda || undefined,
        tipo: tipoFiltro || undefined,
        pagina,
      });
      setClientes(res.clientes);
      setTotal(res.total);
      setPaginas(res.paginas);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [busqueda, tipoFiltro, pagina]);

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    await api.deleteCliente(id);
    cargar();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registrados</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="normal">Normal</option>
          <option value="frecuente">Frecuente</option>
          <option value="credito">Crédito</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contacto</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Compras</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">Cargando...</td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{c.telefono ?? <span className="text-gray-300">—</span>}</div>
                    {c.email && <div className="text-xs">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TIPO_BADGE[c.tipo]}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {c._count?.ventas ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetalle(c.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setModal({ open: true, cliente: c })}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.nombre)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {paginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Página {pagina} de {paginas}</p>
            <div className="flex gap-2">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                disabled={pagina === paginas}
                onClick={() => setPagina((p) => p + 1)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modal.open && (
        <ClienteModal
          cliente={modal.cliente}
          onClose={() => setModal({ open: false })}
          onSaved={() => { setModal({ open: false }); cargar(); }}
        />
      )}

      {detalle && (
        <ClienteDetalle
          clienteId={detalle}
          onClose={() => setDetalle(null)}
          onEdit={() => {
            const c = clientes.find((x) => x.id === detalle);
            setDetalle(null);
            if (c) setModal({ open: true, cliente: c });
          }}
        />
      )}
    </div>
  );
}
