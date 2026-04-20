const pesoFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatPeso(centavos: number): string {
  return pesoFormatter.format(centavos / 100);
}

export function formatFecha(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("es-MX", opts ?? {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
