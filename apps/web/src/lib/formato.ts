const entero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const compacto = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 });

export function usd(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `US$ ${entero.format(n)}`;
}

export function usdCorto(n: number): string {
  return Math.abs(n) >= 10_000 ? `US$ ${compacto.format(n)}` : usd(n);
}

export function numero(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : entero.format(n);
}

export function porcentaje(n: number | null | undefined, decimales = 1): string {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

export function tasa(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const p = Math.round(n * 10000) / 100;
  return porcentaje(p, Number.isInteger(p) ? 0 : 2).replace(/(,\d)0 %$/, "$1 %");
}

export function fecha(dia: string | null): string {
  if (!dia) return "—";
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function mesLargo(mes: string | null): string {
  if (!mes) return "—";
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function dias(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const r = Math.round(n);
  return r === 1 ? "1 día" : `${entero.format(r)} días`;
}
