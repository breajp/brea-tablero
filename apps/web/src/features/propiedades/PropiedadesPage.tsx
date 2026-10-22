import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Indicador, Seccion } from "@/components/tablero/Indicador";
import { Chip } from "@/components/ui/Chip";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { esVolumen, mediana, motivoDeBaja, negociacionCreible, promedio } from "@/dominio/calculos";
import { CERRADAS, EN_CURSO, ESTADO, type Status } from "@/dominio/tipos";
import { dias, numero, porcentaje, usd } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { useNombreDe, useSesion } from "@/sesion";

const VIEJA = 180;

export default function PropiedadesPage() {
  const { data, esAdmin } = useSesion();
  const nombreDe = useNombreDe();

  const v = useMemo(() => {
    const deals = data.deals;
    const conDias = (estados: Status[]) => deals.filter((d) => estados.includes(d.status) && d.daysListed !== null && d.reservedAt).map((d) => d.daysListed!);
    const activas = deals.filter((d) => d.status === "activa");
    const cerradas = deals.filter((d) => CERRADAS.includes(d.status) && esVolumen(d));
    const negociadas = cerradas.filter(negociacionCreible);
    const vistas = new Set<string>();
    const unicas = negociadas.filter((d) => (vistas.has(d.deal) ? false : (vistas.add(d.deal), true)));
    const bajas = deals.filter((d) => d.status === "baja");
    const motivos = new Map<string, number>();
    for (const b of bajas) motivos.set(motivoDeBaja(b.notes), (motivos.get(motivoDeBaja(b.notes)) ?? 0) + 1);
    return {
      porEstado: (["activa", "pausada", "reservada", "firma"] as Status[]).map((s) => ({ s, n: deals.filter((d) => d.status === s).length })),
      activas: activas.sort((a, b) => (b.daysListed ?? -1) - (a.daysListed ?? -1)),
      hastaReserva: mediana(conDias([...CERRADAS, ...EN_CURSO])),
      hastaBaja: mediana(conDias(["baja"])),
      activasHoy: mediana(activas.filter((d) => d.daysListed !== null).map((d) => d.daysListed!)),
      nego: promedio(unicas.map((d) => d.negotiationPct!)),
      negociadas: unicas.sort((a, b) => b.negotiationPct! - a.negotiationPct!),
      potencial: activas.reduce((a, d) => a + (d.potential ?? 0), 0),
      conPotencial: activas.filter((d) => d.potential).length,
      bajas: bajas.length,
      motivos: [...motivos.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [data]);

  return (
    <>
      <PageHeader
        eyebrow={esAdmin ? "Cartera" : "Tu cartera"}
        title="Propiedades"
        lede="Cuánto tarda una propiedad en reservarse, cuánto se negocia y por qué se va. Los días son medianas: una propiedad de hace cinco años no desarma el promedio."
        wide
      />

      <section className="px-5 pt-10 md:px-10 md:pt-12">
        <div className="mx-auto grid max-w-[1320px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador etiqueta="Activas hoy" valor={numero(v.porEstado[0].n)} detalle={`publicadas hace ${dias(v.activasHoy)} (mediana)`} />
          <Indicador etiqueta="Hasta reservarse" valor={dias(v.hastaReserva)} detalle="mediana, desde el ingreso" />
          <Indicador etiqueta="Hasta la baja" valor={dias(v.hastaBaja)} detalle={`${numero(v.bajas)} bajas cargadas`} />
          <Indicador etiqueta="Negociación promedio" valor={porcentaje(v.nego)} detalle="del precio publicado al de cierre" />
        </div>
      </section>

      <Seccion titulo="Cartera hoy">
        <div className="flex flex-col gap-4 rounded-panel bg-paper-raised p-5 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-base">
            {v.porEstado.map(({ s, n }) => (
              <Chip key={s} tone={ESTADO[s].tone} className="min-h-[30px] px-3">
                {ESTADO[s].label} <span className="font-semibold tnum">{n}</span>
              </Chip>
            ))}
          </div>
          <div className="md:text-right">
            <div className="label">Comisión potencial de las activas</div>
            <div className="font-display text-h3 font-semibold text-ink tnum">{usd(v.potencial)}</div>
            <div className="text-meta text-ink-3">
              Si se venden al precio publicado. Solo {v.conPotencial} de {v.porEstado[0].n} tienen precio y % cargados.
            </div>
          </div>
        </div>
      </Seccion>

      <div className="mx-auto grid max-w-[1320px] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Seccion titulo="Precio publicado y de cierre" bajada="Ventas y compras cerradas, de la que más se negoció a la que menos." className="lg:pr-5">
          <div className="overflow-x-auto rounded-panel bg-paper-raised shadow-card">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="text-meta text-ink-3">
                  <th className="px-5 py-3 font-medium">Propiedad</th>
                  <th className="px-3 py-3 text-right font-medium">Publicada</th>
                  <th className="px-3 py-3 text-right font-medium">Cierre</th>
                  <th className="px-5 py-3 text-right font-medium">Negociación</th>
                </tr>
              </thead>
              <tbody>
                {v.negociadas.map((d) => (
                  <tr key={d.row} className="border-t border-rule/70 text-base text-ink-2 tnum">
                    <td className="max-w-[16rem] truncate px-5 py-2.5 text-ink">{d.property}</td>
                    <td className="px-3 py-2.5 text-right">{usd(d.listPrice)}</td>
                    <td className="px-3 py-2.5 text-right">{usd(d.closePrice)}</td>
                    <td className={cn("px-5 py-2.5 text-right font-medium", d.negotiationPct! > 10 ? "text-fail" : d.negotiationPct! < 0 ? "text-pass" : "text-ink")}>
                      {porcentaje(d.negotiationPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>

        <div className="lg:pl-5">
          <Seccion titulo="Por qué se dieron de baja" bajada="Sale de la columna Data de la planilla.">
            <ul className="space-y-1 rounded-panel bg-paper-raised p-2 shadow-card">
              {v.motivos.map(([motivo, n]) => (
                <li key={motivo} className="grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-3 rounded-control px-3 py-2.5 hover:bg-paper-sunken/60">
                  <span className="truncate text-base text-ink-2">{motivo}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-paper-sunken" aria-hidden>
                    <span className="block h-full rounded-full bg-fail/70" style={{ width: `${(n / v.bajas) * 100}%` }} />
                  </span>
                  <span className="text-right text-base text-ink tnum">{n}</span>
                </li>
              ))}
            </ul>
          </Seccion>
          <Seccion titulo="Ajustes de precio">
            <div className="rounded-panel bg-paper-raised px-5 shadow-card">
              <EstadoVacio
                icon={TrendingDown}
                titulo="Sin historial de precios todavía"
                bajada="La planilla guarda un solo precio por propiedad. Con una pestaña Precios (propiedad, fecha, precio) acá se ve cada baja y cuánto tardó en reservarse después."
              />
            </div>
          </Seccion>
        </div>
      </div>

      <Seccion titulo="Activas, de la más vieja a la más nueva" bajada={`Las de más de ${VIEJA} días van marcadas.`}>
        <div className="overflow-x-auto rounded-panel bg-paper-raised shadow-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-meta text-ink-3">
                <th className="px-5 py-3 font-medium">Propiedad</th>
                <th className="px-3 py-3 font-medium">Agente</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 text-right font-medium">Precio</th>
                <th className="px-5 py-3 text-right font-medium">Publicada hace</th>
              </tr>
            </thead>
            <tbody>
              {v.activas.map((d) => (
                <tr key={d.row} className="border-t border-rule/70 text-base text-ink-2 tnum">
                  <td className="max-w-[18rem] truncate px-5 py-2.5 text-ink">{d.property}</td>
                  <td className="px-3 py-2.5">{nombreDe(d.agent)}</td>
                  <td className="px-3 py-2.5">{d.typology ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">{usd(d.listPrice)}</td>
                  <td className="px-5 py-2.5 text-right">
                    {d.daysListed === null ? (
                      <Chip tone="muted">Sin fecha de ingreso</Chip>
                    ) : d.daysListed > VIEJA ? (
                      <Chip tone="warn" mono>
                        {dias(d.daysListed)}
                      </Chip>
                    ) : (
                      dias(d.daysListed)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>
      <div className="h-16" />
    </>
  );
}
