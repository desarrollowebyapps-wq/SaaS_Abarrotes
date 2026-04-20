import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from "lucide-react";
import * as inventarioApi from "../api/inventario";
import * as ventasApi from "../api/ventas";
import type { Producto } from "../api/inventario";
import { formatPeso } from "../utils/format";

interface CartItem {
  producto: Producto;
  cantidad: number;
}

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"];
const IVA = 0.16;
const fmt = formatPeso;

export default function POS() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [procesando, setProcesando] = useState(false);
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar productos con debounce
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await inventarioApi.getProductos({ busqueda, limite: 8 } as Parameters<typeof inventarioApi.getProductos>[0]);
        setResultados(res.productos);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  function agregarAlCarrito(producto: Producto) {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setBusqueda("");
    setResultados([]);
    inputRef.current?.focus();
  }

  function cambiarCantidad(id: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) => i.producto.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    );
  }

  function quitarItem(id: string) {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== id));
  }

  // Totales — memoizados para no recalcular en cada render
  const { subtotal, descuentoCentavos, iva, total } = useMemo(() => {
    const subtotal = carrito.reduce((acc, i) => acc + i.producto.precio_venta * i.cantidad, 0);
    const descuentoCentavos = Math.round(descuento * 100);
    const base = subtotal - descuentoCentavos;
    const iva = Math.round(base * IVA);
    return { subtotal, descuentoCentavos, iva, total: base + iva };
  }, [carrito, descuento]);

  async function cobrar() {
    if (carrito.length === 0) return;
    setError("");
    setProcesando(true);
    try {
      const resultado = await ventasApi.createVenta({
        items: carrito.map((i) => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_unitario: i.producto.precio_venta,
        })),
        descuento: descuentoCentavos,
        metodo_pago: metodoPago,
      });
      setTicket(resultado);
      setCarrito([]);
      setDescuento(0);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al procesar la venta";
      setError(msg);
    } finally {
      setProcesando(false);
    }
  }

  // Pantalla de ticket exitoso
  if (ticket) {
    const t = ticket as {
      numero_ticket: string;
      total_neto: number;
      impuesto: number;
      descuento: number;
      metodo_pago: string;
      detalles: Array<{ producto: { nombre: string }; cantidad: number; precio_unitario: number }>;
    };
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Venta registrada</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">Ticket {t.numero_ticket}</p>

          <div className="text-left bg-gray-50 rounded-xl p-4 space-y-1.5 mb-6">
            {t.detalles.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{d.producto.nombre} ×{d.cantidad}</span>
                <span className="text-gray-900">{fmt(d.precio_unitario * d.cantidad)}</span>
              </div>
            ))}
            {t.descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span><span>-{fmt(t.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>IVA (16%)</span><span>{fmt(t.impuesto)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{fmt(t.total_neto)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center pt-1 capitalize">{t.metodo_pago}</p>
          </div>

          <button
            onClick={() => setTicket(null)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Nueva venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-full">
      {/* Panel izquierdo — Buscador */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Punto de Venta</h1>
          <p className="text-sm text-gray-500 mt-0.5">Busca o escanea el código del producto</p>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Nombre o código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {buscando ? (
              <p className="text-center py-6 text-sm text-gray-400">Buscando...</p>
            ) : (
              resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.codigo} · Stock: {p.stock_actual}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-gray-900">{fmt(p.precio_venta)}</p>
                    <p className="text-xs text-gray-400">{p.categoria.nombre}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {busqueda && resultados.length === 0 && !buscando && (
          <p className="text-sm text-gray-400 text-center py-4">
            No se encontraron productos
          </p>
        )}

        {carrito.length === 0 && !busqueda && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-300">
              <ShoppingCart size={48} className="mx-auto mb-3" />
              <p className="text-sm">Busca un producto para comenzar</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel derecho — Carrito */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-xl border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Carrito {carrito.length > 0 && <span className="text-gray-400">({carrito.length})</span>}
            </h2>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {carrito.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Vacío</p>
            ) : (
              carrito.map((item) => (
                <div key={item.producto.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 leading-tight flex-1">
                      {item.producto.nombre}
                    </p>
                    <button
                      onClick={() => quitarItem(item.producto.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, -1)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, 1)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {fmt(item.producto.precio_venta * item.cantidad)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales */}
          {carrito.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Descuento ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value))}
                  className="w-20 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>IVA (16%)</span><span>{fmt(iva)}</span>
              </div>

              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span><span className="text-lg">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Método de pago + Cobrar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Método de pago</label>
            <div className="grid grid-cols-3 gap-1.5">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    metodoPago === m
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={cobrar}
            disabled={carrito.length === 0 || procesando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {procesando ? "Procesando..." : `Cobrar ${carrito.length > 0 ? fmt(total) : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
