export type Status =
  | "activa"
  | "reservada"
  | "firma"
  | "vendida"
  | "alquilada"
  | "comprada"
  | "pausada"
  | "baja";

export type Role = "productor" | "agente" | "lider" | "gerencia";

export interface Person {
  id: string;
  name: string;
  rate: number | null;
  category?: string | null;
  role?: string | null;
}

// De la planilla de comisiones de Gonzalo. La meta es la producción bruta anual que hay que
// alcanzar para pasar a la categoría siguiente.
export interface Category {
  name: string;
  agentRate: number;
  leaderRate: number;
  breaRate: number;
  goal: number | null;
  requirement: string | null;
}

// Los montos de la distribución vienen solo en la vista de admin: el paquete de un agente
// los trae vacíos y su parte sale de `shares`.
export interface Deal {
  row: number;
  deal: string;
  property: string;
  status: Status;
  producer: string | null;
  agent: string | null;
  leader: string | null;
  kind: string | null;
  typology: string | null;
  sellerFee: number | null;
  buyerFee: number | null;
  internalSplit: number | null;
  notes: string | null;
  listedAt: string | null;
  reservedAt: string | null;
  signedAt: string | null;
  billingMonth: string | null;
  listPrice: number | null;
  closePrice: number | null;
  deedPrice: number | null;
  negotiationPct: number | null;
  daysListed: number | null;
  potential: number | null;
  // Una operación de a tres: alguien del equipo que cobra como un agente más, o un Externo que se
  // lleva todo su bruto. Su bruto y neto son privados como el resto del reparto.
  third?: string | null;
  thirdRate?: number | null;
  thirdGross?: number | null;
  thirdNet?: number | null;
  // Lo que el equipo marca OK, Pendiente o No aplica en la planilla (Autorización, DNI, UIF…).
  checklist?: { item: string; status: string }[];
  signing?: { kind: string | null; at: string | null; place: string | null; notary: string | null };
  gross?: number | null;
  producerGross?: number | null;
  agentGross?: number | null;
  producerNet?: number | null;
  agentNet?: number | null;
  office?: number | null;
  leaderNet?: number | null;
  management?: number | null;
  brea?: number | null;
  producerLabel?: string | null;
}

export interface Share {
  row: number;
  deal: string;
  person: string;
  role: Role;
  gross: number;
  net: number;
  stage: "cerrada" | "en-curso";
  month: string | null;
}

export interface Issue {
  kind: "formula" | "copia" | "fecha" | "moneda" | "regla" | "planilla";
  row: number;
  property: string;
  detail: string;
  // Lo que el equipo explicó en la columna NOTA de Para revisar.
  note?: string;
  column?: string;
  sheet?: string;
}

export interface Tablero {
  generatedAt: string;
  // Fecha y hora (Argentina) en que se leyó la planilla.
  updatedAt?: string;
  source: string;
  people: Person[];
  // El nombre de quien comparte una operación con un agente o una líder sin ser de su equipo.
  names?: Record<string, string>;
  categories?: Category[];
  deals: Deal[];
  shares: Share[];
  issues: Issue[];
  costs?: { month: string; usd: number }[];
  priceChanges?: { property: string; date: string | null; price: number | null }[];
}

export interface Usuario {
  name: string;
  role: "admin" | "lider" | "agente";
  person: string;
  team?: string[];
}

export const ESTADO: Record<Status, { label: string; tone: "neutral" | "muted" | "pass" | "fail" | "warn" | "ember" }> = {
  activa: { label: "Activa", tone: "neutral" },
  reservada: { label: "Reservada", tone: "warn" },
  firma: { label: "Firma pautada", tone: "warn" },
  vendida: { label: "Vendida", tone: "pass" },
  alquilada: { label: "Alquilada", tone: "pass" },
  comprada: { label: "Comprada", tone: "pass" },
  pausada: { label: "Pausada", tone: "muted" },
  baja: { label: "Baja", tone: "fail" },
};

export const ROL: Record<Role, string> = { productor: "Productor", agente: "Agente", lider: "Líder", gerencia: "Gerencia" };

export const CERRADAS: Status[] = ["vendida", "alquilada", "comprada"];
export const EN_CURSO: Status[] = ["reservada", "firma"];
export const EN_CARTERA: Status[] = ["activa", "pausada"];
