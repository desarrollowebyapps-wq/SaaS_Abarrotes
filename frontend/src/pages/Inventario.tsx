import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, AlertTriangle, SlidersHorizontal, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import * as api from "../api/inventario";
import type { Producto, Categoria, Movimiento } from "../api/inventario";
import ProductoModal from "../components/inventario/ProductoModal";
import AjusteModal from "../components/inventario/AjusteModal";
import { formatPeso } from "../utils/format";

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  entrada:    { label: "Entrada",    color: "text-green-600 bg-green-50" },
  salida:     { label: "Salida",     color: "text-red-500 bg-red-50" },
  ajuste:     { label: "Ajuste",     color: "text-amber-600 bg-amber-50" },
  devolución: { label: "Devolución", color: "text-blue-600 bg-blue-50" },
};

const MOTIVO_LABEL: Record<string, string> = {
  error_conteo: "Error de conteo",
  merma: "Merma / caducidad",
  robo: "Robo / pérdida",
  entrada: "Entrada de mercancía",
  devolucion: "Devolución a proveedor",
  venta: "Venta",
  otro: "Otro",
};

export default function Inventario() {
  const [tab, setTab] = useState<"productos" | "movimientos">("productos");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; producto?: Producto }>({ open: false });

  // Movimientos
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movTotal, setMovTotal] = useState(0);
  const [movPagina, setMovPagina] = useState(1);
  const [movPaginas, setMovPaginas] = useState(1);
  const [movLoading, setMovLoading] = useState(false);
  const [movTipo, setMovTipo] = useState("");
  const [movDesde, setMovDesde] = useState("");
  const [movHasta, setMovHasta] = useState("");

  // Producto seleccionado para ajuste de stock
  const [ajusteProducto, setAjusteProducto] = useState<Producto | null>(null);

  async function cargar() {
    setLoading(true);
    try {
      const res = await api.getProductos({
        busqueda: busqueda || undefined,
        categoria_id: categoriaFiltro || undefined,
        pagina,
      });
      setProductos(res.productos);
      setTotal(res.total);
      setPaginas(res.paginas);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getCategorias().then(setCategorias);
  }, []);

  useEffect(() => {
    cargar();
  }, [busqueda, categoriaFiltro, pagina]);

  async function cargarMovimientos() {
    setMovLoading(true);
    try {
      const res = await api.getMovimientos({
        tipo: movTipo || undefined,
        desde: movDesde || undefined,
        hasta: movHasta || undefined,
        pagina: movPagina,
      });
      setMovimientos(res.movimientos);
      setMovTotal(res.total);
      setMovPaginas(res.paginas);
    } finally {
      setMovLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "movimientos") cargarMovimientos();
  }, [tab, movTipo, movDesde, movHasta, movPagina]);

  async function handleDelete(id: string) {
    if (!confirm("¿Desactivar este producto?")) return;
    await api.deleteProducto(id);
    cargar();
  }

  async function handleAjusteConfirm(nueva_cantidad: number, motivo: string, notas?: string) {
    if (!ajusteProducto) return;
    const actualizado = await api.ajustarStock(ajusteProducto.id, { nueva_cantidad, motivo, notas });
    setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tab === "productos" ? `${total} productos` : `${movTotal} movimientos`}
          </p>
        </div>
        {tab === "productos" && (
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["productos", "movimientos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "productos" ? "Productos" : "Historial de movimientos"}
          </button>
        ))}
      </div>

      {/* Filtros productos */}
      {tab === "productos" && (<>
      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={(e) => { setCategoriaFiltro(e.target.value); setPagina(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Código</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoría</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Precio</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoria.nombre}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatPeso(p.precio_costo)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPeso(p.precio_venta)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        p.stock_actual <= p.stock_minimo
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {p.stock_actual <= p.stock_minimo && <AlertTriangle size={13} />}
                      {p.stock_actual} {p.unidad_medida}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAjusteProducto(p)}
                        title="Ajustar stock"
                        className="text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        <SlidersHorizontal size={15} />
                      </button>
                      <button
                        onClick={() => setModal({ open: true, producto: p })}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
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

        {/* Paginación */}
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
      </>)}

      {/* ── Historial de movimientos ─────────────────────────── */}
      {tab === "movimientos" && (<>
        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <select
            value={movTipo}
            onChange={(e) => { setMovTipo(e.target.value); setMovPagina(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolución">Devolución</option>
          </select>
          <input
            type="date"
            value={movDesde}
            onChange={(e) => { setMovDesde(e.target.value); setMovPagina(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={movHasta}
            onChange={(e) => { setMovHasta(e.target.value); setMovPagina(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setMovTipo(""); setMovDesde(""); setMovHasta(""); setMovPagina(1); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw size={13} /> Limpiar
          </button>
        </div>

        {/* Tabla movimientos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cantidad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Motivo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : movimientos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin movimientos registrados</td></tr>
              ) : (
                movimientos.map((m) => {
                  const cfg = TIPO_CONFIG[m.tipo] ?? { label: m.tipo, color: "text-gray-600 bg-gray-100" };
                  const positivo = m.cantidad >= 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{m.producto.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono">{m.producto.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-0.5 font-semibold ${positivo ? "text-green-600" : "text-red-500"}`}>
                          {positivo ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {Math.abs(m.cantidad)} {m.producto.unidad_medida}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {MOTIVO_LABEL[m.motivo ?? ""] ?? m.motivo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{m.referencia ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {movPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Página {movPagina} de {movPaginas}</p>
              <div className="flex gap-2">
                <button
                  disabled={movPagina === 1}
                  onClick={() => setMovPagina((p) => p - 1)}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  disabled={movPagina === movPaginas}
                  onClick={() => setMovPagina((p) => p + 1)}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </>)}

      {/* Modal editar/crear producto */}
      {modal.open && (
        <ProductoModal
          producto={modal.producto}
          categorias={categorias}
          onClose={() => setModal({ open: false })}
          onSaved={() => { setModal({ open: false }); cargar(); }}
        />
      )}

      {/* Modal ajuste de stock — componente independiente (SRP) */}
      {ajusteProducto && (
        <AjusteModal
          producto={ajusteProducto}
          onClose={() => setAjusteProducto(null)}
          onConfirm={handleAjusteConfirm}
        />
      )}
    </div>
  );
}
