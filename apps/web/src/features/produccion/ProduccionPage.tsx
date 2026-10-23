import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarrasPorMes, Reparto } from "@/components/tablero/Graficos";
import { Indicador, Seccion } from "@/components/tablero/Indicador";
import { SelectorDePeriodo } from "@/components/tablero/SelectorDePeriodo";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { anterior, hayHistorico, participacionesPorMes, produccion } from "@/dominio/calculos";
import { contieneMes, nombre, nombreAnterior } from "@/dominio/periodo";
import { ESTADO, ROL, type Category, type Role } from "@/dominio/tipos";
import { mesLargo, numero, tasa, usd } from "@/lib/formato";
import NotFoundPage from "@/pages/NotFoundPage";
import { useSesion } from "@/sesion";

export default function ProduccionPage() {
  const { id } = useParams();
  const { data, user, periodo, esAdmin } = useSesion();
  const persona = id ?? user.person;
  const quien = data.people.find((p) => p.id === persona);
  const propia = persona === user.person && !id;

  const p = useMemo(() => produccion(data.shares, persona, periodo), [data, persona, periodo]);
  const previo = useMemo(() => produccion(data.shares, persona, anterior(periodo)), [data, persona, periodo]);
  const anual = useMemo(() => produccion(data.shares, persona, { granularidad: "anio", anio: periodo.anio, indice: 1 }), [data, persona, periodo.anio]);
  const contra = nombreAnterior(periodo);
  const conHistorico = hayHistorico(data, anterior(periodo));

  const operaciones = useMemo(() => {
    const porTrato = new Map<string, { deal: string; roles: Role[]; gross: number; net: number; stage: string; month: string | null; row: number }>();
    for (const s of data.shares.filter((s) => s.person === persona)) {
      const o = porTrato.get(s.deal + s.row) ?? { deal: s.deal, roles: [], gross: 0, net: 0, stage: s.stage, month: s.month, row: s.row };
      o.roles.push(s.role);
      o.gross += s.gross;
      o.net += s.net;
      porTrato.set(s.deal + s.row, o);
    }
    return [...porTrato.values()]
      .map((o) => ({ ...o, d: data.deals.find((d) => d.row === o.row)! }))
      .sort((a, b) => (b.month ?? "").localeCompare(a.month ?? ""));
  }, [data, persona]);

  const categoria = data.categories?.find((c) => c.name === quien?.category);

  if (!quien) return <NotFoundPage />;

  return (
    <>
      {esAdmin && id && (
        <div className="px-5 pt-6 md:px-10 md:pt-8">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/agentes">
                <ArrowLeft className="h-3.5 w-3.5" /> Agentes
              </Link>
            </Button>
            <Chip tone="ember">
              <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Así ve {quien.name} su tablero
            </Chip>
          </div>
        </div>
      )}
      <PageHeader
        className={esAdmin && id ? "pt-5 md:pt-6" : undefined}
        eyebrow={propia ? `Hola, ${quien.name}` : "Producción individual"}
        title={propia ? "Tu producción" : quien.name}
        lede={`La producción es el bruto que ${propia ? "generaste" : "generó"} como productor, agente y líder, en el mes de cobro. Abajo, lo que ${propia ? "cobraste" : "cobró"} en mano.`}
        actions={<SelectorDePeriodo />}
        wide
      />

      <section className="px-5 pt-10 md:px-10 md:pt-12">
        <div className="mx-auto grid max-w-[1320px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador etiqueta="Producción bruta" valor={usd(p.brutoCerrado)} actual={p.brutoCerrado} previo={conHistorico ? previo.brutoCerrado : null} contraQue={contra} />
          <Indicador etiqueta="Neto cobrado" valor={usd(p.netoCerrado)} actual={p.netoCerrado} previo={conHistorico ? previo.netoCerrado : null} contraQue={contra} detalle="lo que queda después del reparto" />
          <Indicador etiqueta="En curso" valor={usd(p.brutoEnCurso)} detalle={`bruto reservado y a la firma · ${usd(p.netoEnCurso)} netos`} />
          <Indicador etiqueta={`Acumulado ${periodo.anio}`} valor={usd(anual.brutoCerrado)} detalle={`${usd(anual.netoCerrado)} netos · ${numero(anual.operaciones)} operaciones`} />
        </div>
      </section>

      {categoria && <TuCategoria categoria={categoria} produccion={anual.brutoCerrado} anio={periodo.anio} propia={propia} />}

      <div className="mx-auto grid max-w-[1320px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Seccion titulo={`Producción bruta por mes · ${periodo.anio}`} className="lg:pr-5">
          <BarrasPorMes meses={participacionesPorMes(data.shares.filter((s) => s.person === persona), periodo.anio)} enPeriodo={(m) => contieneMes(periodo, m)} etiqueta="Producción bruta" />
        </Seccion>
        <Seccion titulo="Por rol" bajada={`En ${nombre(periodo)}.`} className="lg:pl-5">
          <div className="rounded-panel bg-paper-raised p-2 shadow-card">
            <Reparto
              total={p.brutoCerrado}
              porciones={(["productor", "agente", "lider"] as Role[]).map((rol) => ({
                clave: rol,
                etiqueta: `Como ${ROL[rol].toLowerCase()}`,
                valor: p.porRol[rol],
              }))}
            />
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Operaciones" bajada="Todas las del año en las que participó: el bruto que generó y, abajo, lo que cobra.">
        {operaciones.length === 0 ? (
          <EstadoVacio icon={Eye} titulo="Ninguna operación todavía" bajada="Cuando se reserve o se cierre una operación con esta persona, aparece acá." />
        ) : (
          <ul className="space-y-1">
            {operaciones.map((o) => (
              <li key={o.deal + o.row} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-panel bg-paper-raised px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_10rem_8rem] md:px-5">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-ink">{o.d.property}</div>
                  <div className="mt-0.5 text-meta text-ink-3">
                    {o.d.kind ?? "—"} · cobro {mesLargo(o.month)}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 text-meta md:justify-start">
                  {o.roles.map((r) => (
                    <Chip key={r} tone="muted">
                      {ROL[r]}
                    </Chip>
                  ))}
                </div>
                <div className="text-meta md:text-right">
                  <Chip tone={ESTADO[o.d.status].tone}>{ESTADO[o.d.status].label}</Chip>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium text-ink tnum">{usd(o.gross)}</div>
                  <div className="text-meta text-ink-4 tnum">{usd(o.net)} neto</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
      <div className="h-16" />
    </>
  );
}

function TuCategoria({ categoria: c, produccion, anio, propia }: { categoria: Category; produccion: number; anio: number; propia: boolean }) {
  const avance = c.goal ? Math.min(produccion / c.goal, 1) : null;
  const falta = c.goal ? Math.max(c.goal - produccion, 0) : 0;
  return (
    <Seccion titulo="Categoría" bajada="Según la planilla de comisiones: la meta es la producción bruta del año para pasar a la categoría siguiente.">
      <div className="grid gap-6 rounded-panel bg-paper-raised p-5 shadow-card md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:p-6">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-base">
            <Chip tone="neutral" className="min-h-[28px] px-3 font-medium">
              {c.name.startsWith("Acuerdo") ? c.name : `Agente ${c.name}`}
            </Chip>
          </div>
          <p className="text-base text-ink-2 tnum">
            {[`${tasa(c.agentRate)} para ${propia ? "vos" : "el agente"}`, c.leaderRate > 0 ? `${tasa(c.leaderRate)} para el líder` : null, `${tasa(c.breaRate)} para Brea`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {c.requirement && <p className="text-meta text-ink-3">Para pasar a la siguiente: {c.requirement}.</p>}
        </div>
        {c.goal ? (
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="label">Meta {anio}</span>
              <span className="font-display text-h3 font-semibold text-ink tnum">{usd(c.goal)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-paper-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((avance ?? 0) * 100)} aria-label="Avance de la meta">
              <div className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out" style={{ width: `${(avance ?? 0) * 100}%` }} />
            </div>
            <p className="text-base text-ink-2 tnum">
              {falta === 0 ? (
                <>Meta cumplida: {usd(produccion)} de producción bruta en {anio}.</>
              ) : (
                <>
                  {propia ? "Llevás" : "Lleva"} {usd(produccion)} ({Math.round((avance ?? 0) * 100)} %). {propia ? "Te faltan" : "Le faltan"} <span className="font-medium text-ink">{usd(falta)}</span>.
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="self-center text-base text-ink-2">
            {c.name.startsWith("Acuerdo") ? "Es un acuerdo aparte con Gonzalo: no tiene una meta de categoría." : "Es la categoría más alta: no tiene una meta para pasar a otra."}
          </p>
        )}
      </div>
    </Seccion>
  );
}
