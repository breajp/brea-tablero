import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Dato, Reparto } from "@/components/tablero/Graficos";
import { Chip } from "@/components/ui/Chip";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { CERRADAS, EN_CARTERA, EN_CURSO, ESTADO, ROL, type Deal } from "@/dominio/tipos";
import { fecha, mesLargo, porcentaje, tasa, usd, dias } from "@/lib/formato";
import { useNombreDe, useSesion } from "@/sesion";

type Filtro = "en-curso" | "cerradas" | "cartera" | "bajas" | "todas";

const FILTROS: Record<Filtro, (d: Deal) => boolean> = {
  "en-curso": (d) => EN_CURSO.includes(d.status),
  cerradas: (d) => CERRADAS.includes(d.status),
  cartera: (d) => EN_CARTERA.includes(d.status),
  bajas: (d) => d.status === "baja",
  todas: () => true,
};

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default function OperacionesPage() {
  const { data, esAdmin, user } = useSesion();
  const nombreDe = useNombreDe();
  const [filtro, setFiltro] = useState<Filtro>("cerradas");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<Deal | null>(null);

  const cuenta = (f: Filtro) => data.deals.filter(FILTROS[f]).length;
  const filas = useMemo(() => {
    const busqueda = sinTildes(q.trim());
    return data.deals
      .filter(FILTROS[filtro])
      .filter((d) => !busqueda || sinTildes(`${d.property} ${nombreDe(d.producer)} ${nombreDe(d.agent)} ${d.notes ?? ""}`).includes(busqueda))
      .sort((a, b) => (b.reservedAt ?? b.listedAt ?? "").localeCompare(a.reservedAt ?? a.listedAt ?? ""));
  }, [data, filtro, q, nombreDe]);

  const miParte = (d: Deal) => data.shares.filter((s) => s.row === d.row && s.person === user.person).reduce((a, s) => a + s.net, 0);

  return (
    <>
      <PageHeader
        eyebrow={esAdmin ? "Brea Propiedades" : "Tus operaciones"}
        title="Operaciones"
        lede={esAdmin ? "Cada fila de la planilla, con su reparto. Tocá una para ver el detalle." : "Las propiedades y operaciones en las que participás, con tu parte."}
        wide
      />
      <section className="px-5 pt-10 md:px-10 md:pt-12">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Segmented<Filtro>
            ariaLabel="Qué operaciones ver"
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: "cerradas", label: "Cerradas", count: cuenta("cerradas") },
              { value: "en-curso", label: "En curso", count: cuenta("en-curso") },
              { value: "cartera", label: "En cartera", count: cuenta("cartera") },
              { value: "bajas", label: "Bajas", count: cuenta("bajas") },
              { value: "todas", label: "Todas", count: cuenta("todas") },
            ]}
          />
          <CampoBusqueda value={q} onChange={setQ} placeholder="Buscar por dirección, persona o nota" ariaLabel="Buscar operaciones" size="md" anuncio={`${filas.length} operaciones`} />
        </div>

        <div className="mx-auto mt-6 max-w-[1320px]">
          {filas.length === 0 ? (
            <EstadoVacio icon={SearchX} titulo="No se encontraron operaciones con" consulta={q.trim() || undefined} bajada="Probá con otra palabra o cambiá el filtro." />
          ) : (
            <ul className="space-y-1">
              {filas.map((d) => (
                <li
                  key={d.row}
                  className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-panel px-4 py-4 transition-[background-color,box-shadow,translate] duration-200 ease-out hover:-translate-y-0.5 hover:bg-paper-raised hover:shadow-card has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-ember md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_9rem] md:px-5"
                >
                  <div className="min-w-0">
                    <button type="button" onClick={() => setAbierta(d)} className="truncate text-left font-display text-h3 font-semibold text-ink outline-hidden after:absolute after:inset-0">
                      {d.property}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
                      <Chip tone={ESTADO[d.status].tone}>{ESTADO[d.status].label}</Chip>
                      <span>{[d.kind, d.typology].filter(Boolean).join(" · ") || "Sin tipo cargado"}</span>
                    </div>
                  </div>
                  <div className="hidden min-w-0 text-meta text-ink-2 md:block">
                    <div className="truncate">Productor {esAdmin && d.producerLabel ? d.producerLabel : nombreDe(d.producer)}</div>
                    <div className="truncate text-ink-3">
                      Agente {nombreDe(d.agent)}
                      {d.leader && ` · Líder ${nombreDe(d.leader)}`}
                    </div>
                  </div>
                  <div className="hidden text-right md:block">
                    <div className="text-base text-ink tnum">{usd(d.closePrice ?? d.listPrice)}</div>
                    <div className="text-meta text-ink-4">{d.closePrice ? "cierre" : d.listPrice ? "publicada" : "sin precio"}</div>
                  </div>
                  <div className="text-right">
                    {esAdmin ? (
                      <>
                        <div className="text-base font-medium text-ink tnum">{d.gross ? usd(d.gross) : "—"}</div>
                        <div className="text-meta text-ink-4">{d.gross ? "bruto" : d.potential ? `potencial ${usd(d.potential)}` : "sin comisión"}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-base font-medium text-ink tnum">{miParte(d) ? usd(miParte(d)) : "—"}</div>
                        <div className="text-meta text-ink-4">tu parte</div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="h-16" />

      {abierta && <Detalle deal={abierta} onCerrar={() => setAbierta(null)} />}
    </>
  );
}

function Detalle({ deal: d, onCerrar }: { deal: Deal; onCerrar: () => void }) {
  const { data, esAdmin } = useSesion();
  const nombreDe = useNombreDe();
  const partes = data.shares.filter((s) => s.row === d.row);
  const enBolsa = data.deals.filter((o) => o.deal === d.deal).length > 1;

  return (
    <Sheet open onOpenChange={(v) => !v && onCerrar()} title={d.property} description={`${ESTADO[d.status].label} · fila ${d.row} de la planilla`} width="lg">
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Dato etiqueta="Operación">{d.kind ?? "—"}</Dato>
          <Dato etiqueta="Tipología">{d.typology ?? "—"}</Dato>
          <Dato etiqueta="Ingreso">{fecha(d.listedAt)}</Dato>
          <Dato etiqueta={d.status === "baja" ? "Baja" : "Reserva"}>{fecha(d.reservedAt)}</Dato>
          <Dato etiqueta="Precio publicado">{usd(d.listPrice)}</Dato>
          <Dato etiqueta="Precio de cierre">{usd(d.closePrice)}</Dato>
          <Dato etiqueta="Negociación">{porcentaje(d.negotiationPct)}</Dato>
          <Dato etiqueta="Días publicada">{dias(d.daysListed)}</Dato>
          <Dato etiqueta="Honorario vendedor">{tasa(d.sellerFee)}</Dato>
          <Dato etiqueta="Honorario comprador">{tasa(d.buyerFee)}</Dato>
          <Dato etiqueta="Acuerdo interno">{tasa(d.internalSplit)}</Dato>
          <Dato etiqueta="Mes de cobro">{mesLargo(d.billingMonth)}</Dato>
        </div>

        <div className="flex flex-wrap gap-2 text-meta">
          <Chip tone="muted">Productor {nombreDe(d.producer)}</Chip>
          <Chip tone="muted">Agente {nombreDe(d.agent)}</Chip>
          {d.leader && <Chip tone="muted">Líder {nombreDe(d.leader)}</Chip>}
          {enBolsa && <Chip tone="warn">En bolsa: la otra mitad está en otra fila</Chip>}
        </div>

        {d.notes && <p className="rounded-control bg-paper-sunken px-4 py-3 text-base text-ink-2">{d.notes}</p>}

        {esAdmin && d.gross ? (
          <div>
            <h3 className="mb-2 font-display text-h3 font-semibold text-ink">Reparto de {usd(d.gross)}</h3>
            <Reparto
              total={d.gross}
              porciones={[
                { clave: "p", etiqueta: `Productor · ${d.producerLabel ?? nombreDe(d.producer)}`, valor: d.producerNet ?? 0, ayuda: d.producerNet ? undefined : "0 %: su parte queda en la oficina" },
                ...(d.agentNet ? [{ clave: "a", etiqueta: `Agente · ${nombreDe(d.agent)}`, valor: d.agentNet }] : []),
                ...(d.leader ? [{ clave: "l", etiqueta: `Líder · ${nombreDe(d.leader)}`, valor: d.leaderNet ?? 0 }] : []),
                { clave: "g", etiqueta: "Gerencia", valor: d.management ?? 0, ayuda: d.management ? undefined : "sin gerencia en esta operación" },
                { clave: "b", etiqueta: "Brea", valor: d.brea ?? 0, destacada: true },
              ]}
            />
          </div>
        ) : !esAdmin && partes.length > 0 ? (
          <div>
            <h3 className="mb-2 font-display text-h3 font-semibold text-ink">Tu parte</h3>
            <ul className="space-y-1">
              {partes.map((s) => (
                <li key={s.role} className="flex items-center justify-between rounded-control px-3 py-2.5 text-base hover:bg-paper-sunken/60">
                  <span className="text-ink-2">
                    Como {ROL[s.role].toLowerCase()} · bruto {usd(s.gross)}
                  </span>
                  <span className="font-medium text-ink tnum">{usd(s.net)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
