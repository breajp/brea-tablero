export type Granularidad = "mes" | "trimestre" | "anio";

export interface Periodo {
  granularidad: Granularidad;
  anio: number;
  // Mes 1–12 o trimestre 1–4; con año no se usa.
  indice: number;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function mesesDe(p: Periodo): string[] {
  const desde = p.granularidad === "mes" ? p.indice : p.granularidad === "trimestre" ? (p.indice - 1) * 3 + 1 : 1;
  const cuantos = p.granularidad === "mes" ? 1 : p.granularidad === "trimestre" ? 3 : 12;
  return Array.from({ length: cuantos }, (_, i) => `${p.anio}-${String(desde + i).padStart(2, "0")}`);
}

export function contieneMes(p: Periodo, mes: string | null): boolean {
  return mes !== null && mesesDe(p).includes(mes);
}

export function contieneDia(p: Periodo, dia: string | null): boolean {
  return dia !== null && contieneMes(p, dia.slice(0, 7));
}

export function mover(p: Periodo, paso: number): Periodo {
  if (p.granularidad === "anio") return { ...p, anio: p.anio + paso };
  const tope = p.granularidad === "mes" ? 12 : 4;
  const total = p.anio * tope + (p.indice - 1) + paso;
  return { ...p, anio: Math.floor(total / tope), indice: (total % tope) + 1 };
}

export function cambiarGranularidad(p: Periodo, g: Granularidad, mesDeReferencia: string): Periodo {
  const [anio, mes] = mesDeReferencia.split("-").map(Number);
  const base = { anio: p.granularidad === "anio" ? p.anio : anio };
  if (g === "anio") return { granularidad: g, anio: base.anio, indice: 1 };
  if (g === "trimestre") return { granularidad: g, anio, indice: Math.ceil(mes / 3) };
  return { granularidad: g, anio, indice: mes };
}

export function nombre(p: Periodo): string {
  if (p.granularidad === "anio") return String(p.anio);
  if (p.granularidad === "trimestre") return `${p.indice}.º trimestre ${p.anio}`;
  return `${MESES[p.indice - 1]} ${p.anio}`;
}

export function nombreAnterior(p: Periodo): string {
  return { mes: "el mes anterior", trimestre: "el trimestre anterior", anio: "el año anterior" }[p.granularidad];
}
