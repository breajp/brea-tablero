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
import { ESTADO, ROL, type Role } from "@/dominio/tipos";
import { mesLargo, numero, usd } from "@/lib/formato";
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
    const porTrato = new Map<string, { deal: string; roles: Role[]; net: number; stage: string; month: string | null; row: number }>();
    for (const s of data.shares.filter((s) => s.person === persona)) {
      const o = porTrato.get(s.deal + s.row) ?? { deal: s.deal, roles: [], net: 0, stage: s.stage, month: s.month, row: s.row };
      o.roles.push(s.role);
      o.net += s.net;
      porTrato.set(s.deal + s.row, o);
    }
    return [...porTrato.values()]
      .map((o) => ({ ...o, d: data.deals.find((d) => d.row === o.row)! }))
      .sort((a, b) => (b.month ?? "").localeCompare(a.month ?? ""));
  }, [data, persona]);

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
        lede={`Lo que ${propia ? "cobraste" : "cobró"} como productor, agente y líder. Cuenta en el mes de cobro.`}
        actions={<SelectorDePeriodo />}
        wide
      />

      <section className="px-5 pt-10 md:px-10 md:pt-12">
        <div className="mx-auto grid max-w-[1320px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador etiqueta="Neto cobrado" valor={usd(p.netoCerrado)} actual={p.netoCerrado} previo={conHistorico ? previo.netoCerrado : null} contraQue={contra} />
          <Indicador etiqueta="Bruto generado" valor={usd(p.brutoCerrado)} actual={p.brutoCerrado} previo={conHistorico ? previo.brutoCerrado : null} contraQue={contra} detalle="antes del reparto con la oficina" />
          <Indicador etiqueta="En curso" valor={usd(p.netoEnCurso)} detalle="reservadas y a la firma, todavía sin cobrar" />
          <Indicador etiqueta={`Acumulado ${periodo.anio}`} valor={usd(anual.netoCerrado)} detalle={`${numero(anual.operaciones)} operaciones en el año`} />
        </div>
      </section>

      <div className="mx-auto grid max-w-[1320px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Seccion titulo={`Neto por mes · ${periodo.anio}`} className="lg:pr-5">
          <BarrasPorMes meses={participacionesPorMes(data.shares.filter((s) => s.person === persona), periodo.anio)} enPeriodo={(m) => contieneMes(periodo, m)} etiqueta="Neto" />
        </Seccion>
        <Seccion titulo="Por rol" bajada={`En ${nombre(periodo)}.`} className="lg:pl-5">
          <div className="rounded-panel bg-paper-raised p-2 shadow-card">
            <Reparto
              total={p.netoCerrado}
              porciones={(["productor", "agente", "lider"] as Role[]).map((rol) => ({
                clave: rol,
                etiqueta: `Como ${ROL[rol].toLowerCase()}`,
                valor: p.porRol[rol],
              }))}
            />
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Operaciones" bajada="Todas las del año en las que participó, con lo que le corresponde.">
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
                <div className="text-right text-base font-medium text-ink tnum">{usd(o.net)}</div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
      <div className="h-16" />
    </>
  );
}
