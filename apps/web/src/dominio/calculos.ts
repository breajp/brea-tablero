import { contieneDia, contieneMes, mesesDe, mover, type Periodo } from "./periodo";
import { CERRADAS, EN_CURSO, type Deal, type Role, type Share, type Tablero } from "./tipos";

const suma = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);

export const esVolumen = (d: Deal) => d.kind === "Venta" || d.kind === "Compra";

// Tres Arroyos es una unidad aparte de Gonza, sin gerencia: no entra en los números de la
// inmobiliaria de Buenos Aires (la hoja OFICINA tampoco la tiene). Solo el admin trae producerLabel.
export const esTresArroyos = (d: Deal) => d.producerLabel === "Gonza 3A";

export function deBuenosAires(t: Tablero): Tablero {
  const aparte = new Set(t.deals.filter(esTresArroyos).map((d) => d.row));
  return { ...t, deals: t.deals.filter((d) => !aparte.has(d.row)), shares: t.shares.filter((s) => !aparte.has(s.row)) };
}

// Una operación en bolsa son dos filas con el mismo `deal`: para contar y para el volumen va una.
function unicas(deals: Deal[]): Deal[] {
  const vistas = new Set<string>();
  return deals.filter((d) => (vistas.has(d.deal) ? false : (vistas.add(d.deal), true)));
}

export interface Resumen {
  operaciones: number;
  volumen: number;
  bruto: number;
  equipo: number;
  productores: number;
  agentes: number;
  lideres: number;
  gerencia: number;
  brea: number;
  enCursoBruto: number;
  enCursoBrea: number;
  enCursoOperaciones: number;
  altas: number;
  reservas: number;
  bajas: number;
}

export function resumen(t: Tablero, p: Periodo): Resumen {
  const cerradas = t.deals.filter((d) => CERRADAS.includes(d.status) && contieneMes(p, d.billingMonth));
  const enCurso = t.deals.filter((d) => EN_CURSO.includes(d.status));
  const productores = suma(cerradas.map((d) => d.producerNet));
  const agentes = suma(cerradas.map((d) => d.agentNet));
  const lideres = suma(cerradas.map((d) => d.leaderNet));
  return {
    operaciones: unicas(cerradas).length,
    volumen: suma(unicas(cerradas).filter(esVolumen).map((d) => d.closePrice)),
    bruto: suma(cerradas.map((d) => d.gross)),
    productores,
    agentes,
    lideres,
    equipo: productores + agentes + lideres,
    gerencia: suma(cerradas.map((d) => d.management)),
    brea: suma(cerradas.map((d) => d.brea)),
    enCursoBruto: suma(enCurso.map((d) => d.gross)),
    enCursoBrea: suma(enCurso.map((d) => d.brea)),
    enCursoOperaciones: unicas(enCurso).length,
    altas: t.deals.filter((d) => contieneDia(p, d.listedAt)).length,
    reservas: unicas(t.deals.filter((d) => [...CERRADAS, ...EN_CURSO].includes(d.status) && contieneDia(p, d.reservedAt))).length,
    bajas: t.deals.filter((d) => d.status === "baja" && contieneDia(p, d.reservedAt)).length,
  };
}

// La planilla arranca en enero de 2026: compararse con antes de eso da subas de miles por ciento.
export function primerMes(t: Tablero): string {
  return t.deals.map((d) => d.billingMonth).filter((m): m is string => m !== null).sort()[0] ?? t.generatedAt.slice(0, 7);
}

export function hayHistorico(t: Tablero, p: Periodo): boolean {
  return mesesDe(p)[0] >= primerMes(t);
}

export function anterior(p: Periodo): Periodo {
  return mover(p, -1);
}

export function variacion(actual: number, previo: number): number | null {
  if (!previo) return null;
  return (actual - previo) / Math.abs(previo);
}

export interface Mes {
  mes: string;
  cerrado: number;
  enCurso: number;
}

export function porMes(t: Tablero, anio: number, valor: (d: Deal) => number | null | undefined): Mes[] {
  return mesesDe({ granularidad: "anio", anio, indice: 1 }).map((mes) => ({
    mes,
    cerrado: suma(t.deals.filter((d) => CERRADAS.includes(d.status) && d.billingMonth === mes).map(valor)),
    enCurso: suma(t.deals.filter((d) => EN_CURSO.includes(d.status) && d.billingMonth === mes).map(valor)),
  }));
}

export function participacionesPorMes(shares: Share[], anio: number, monto: "gross" | "net" = "gross"): Mes[] {
  return mesesDe({ granularidad: "anio", anio, indice: 1 }).map((mes) => ({
    mes,
    cerrado: suma(shares.filter((s) => s.stage === "cerrada" && s.month === mes).map((s) => s[monto])),
    enCurso: suma(shares.filter((s) => s.stage === "en-curso" && s.month === mes).map((s) => s[monto])),
  }));
}

export type Corte = "semana" | "quincena" | "mes";

export interface Movimiento {
  clave: string;
  etiqueta: string;
  altas: number;
  reservas: number;
  bajas: number;
}

function inicioDeSemana(dia: Date): Date {
  const d = new Date(dia);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function claveDe(dia: string, corte: Corte): string {
  if (corte === "mes") return dia.slice(0, 7);
  if (corte === "quincena") return `${dia.slice(0, 7)}-${Number(dia.slice(8, 10)) <= 15 ? "1" : "2"}`;
  return inicioDeSemana(new Date(`${dia}T00:00:00Z`)).toISOString().slice(0, 10);
}

function claveAnterior(clave: string, corte: Corte): string {
  if (corte === "semana") {
    const d = new Date(`${clave}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  const [a, m] = clave.slice(0, 7).split("-").map(Number);
  const mesPrevio = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
  if (corte === "mes") return mesPrevio;
  return clave.endsWith("-2") ? `${clave.slice(0, 7)}-1` : `${mesPrevio}-2`;
}

export function movimiento(t: Tablero, corte: Corte, hasta: string, cuantos: number): Movimiento[] {
  const claves = [claveDe(hasta, corte)];
  while (claves.length < cuantos) claves.unshift(claveAnterior(claves[0], corte));
  const filas = new Map(claves.map((c) => [c, { altas: 0, reservas: 0, bajas: 0 }]));
  const reservadas = new Set<string>();
  for (const d of t.deals) {
    const alta = d.listedAt && filas.get(claveDe(d.listedAt, corte));
    if (alta) alta.altas++;
    if (!d.reservedAt) continue;
    const fila = filas.get(claveDe(d.reservedAt, corte));
    if (!fila) continue;
    if (d.status === "baja") fila.bajas++;
    else if ([...CERRADAS, ...EN_CURSO].includes(d.status) && !reservadas.has(d.deal)) {
      reservadas.add(d.deal);
      fila.reservas++;
    }
  }
  return claves.map((clave) => ({ clave, etiqueta: etiquetaDeCorte(clave, corte), ...filas.get(clave)! }));
}

const CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function etiquetaDeCorte(clave: string, corte: Corte): string {
  const mes = CORTOS[Number(clave.slice(5, 7)) - 1];
  if (corte === "mes") return mes;
  if (corte === "quincena") return `${clave.endsWith("-1") ? "1.ª" : "2.ª"} ${mes}`;
  return `${Number(clave.slice(8, 10))} ${mes}`;
}

export interface Produccion {
  person: string;
  netoCerrado: number;
  brutoCerrado: number;
  brutoEnCurso: number;
  netoEnCurso: number;
  operaciones: number;
  // La producción de un agente es el bruto que generó (definido con Gonzalo): por rol va en bruto.
  porRol: Record<Role, number>;
}

export function produccion(shares: Share[], person: string, p: Periodo | null): Produccion {
  const suyas = shares.filter((s) => s.person === person);
  const cerradas = suyas.filter((s) => s.stage === "cerrada" && (p === null || contieneMes(p, s.month)));
  const enCurso = suyas.filter((s) => s.stage === "en-curso");
  return {
    person,
    netoCerrado: suma(cerradas.map((s) => s.net)),
    brutoCerrado: suma(cerradas.map((s) => s.gross)),
    brutoEnCurso: suma(enCurso.map((s) => s.gross)),
    netoEnCurso: suma(enCurso.map((s) => s.net)),
    operaciones: new Set(cerradas.map((s) => s.deal)).size,
    porRol: {
      productor: suma(cerradas.filter((s) => s.role === "productor").map((s) => s.gross)),
      agente: suma(cerradas.filter((s) => s.role === "agente").map((s) => s.gross)),
      lider: suma(cerradas.filter((s) => s.role === "lider").map((s) => s.gross)),
    },
  };
}

export function promedio(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null;
}

export function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

// Una negociación de más de 50 % es casi siempre un precio en pesos contra otro en dólares.
export const negociacionCreible = (d: Deal) => d.negotiationPct !== null && Math.abs(d.negotiationPct) <= 50;

const MOTIVOS: [RegExp, string][] = [
  [/otra inmobiliaria/i, "La tomó otra inmobiliaria"],
  [/directo/i, "Vendieron directo"],
  [/no quiere|no quieren|frena|herencia/i, "El dueño dejó de vender"],
  [/proyecto/i, "El proyecto no avanzó"],
  [/mostrar/i, "No se podía mostrar"],
  [/alquilaron/i, "La alquilaron"],
];

export function motivoDeBaja(nota: string | null): string {
  if (!nota) return "Sin motivo cargado";
  return MOTIVOS.find(([re]) => re.test(nota))?.[1] ?? "Otro";
}
