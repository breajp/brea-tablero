import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarrasPorMes, MovimientoDeCartera, Reparto } from "@/components/tablero/Graficos";
import { Indicador, Seccion } from "@/components/tablero/Indicador";
import { SelectorDePeriodo } from "@/components/tablero/SelectorDePeriodo";
import { Button } from "@/components/ui/Button";
import { Halos } from "@/components/ui/Halos";
import { Segmented } from "@/components/ui/Segmented";
import { anterior, deBuenosAires, hayHistorico, movimiento, porMes, produccion, resumen, type Corte } from "@/dominio/calculos";
import { contieneMes, nombre, nombreAnterior } from "@/dominio/periodo";
import { EN_CARTERA } from "@/dominio/tipos";
import { numero, usd } from "@/lib/formato";
import { useSesion } from "@/sesion";

export default function GeneralPage() {
  const { data: todo, periodo } = useSesion();
  const data = useMemo(() => deBuenosAires(todo), [todo]);
  const r = useMemo(() => resumen(data, periodo), [data, periodo]);
  const previoCompleto = useMemo(() => resumen(data, anterior(periodo)), [data, periodo]);
  const conHistorico = hayHistorico(data, anterior(periodo));
  const previo = Object.fromEntries(Object.entries(previoCompleto).map(([k, v]) => [k, conHistorico ? v : null])) as Record<keyof typeof previoCompleto, number | null>;
  const contra = nombreAnterior(periodo);
  const [corte, setCorte] = useState<Corte>("mes");
  const filas = useMemo(
    () => movimiento(data, corte, data.generatedAt, corte === "mes" ? 12 : corte === "quincena" ? 16 : 16),
    [data, corte],
  );
  const cartera = data.deals.filter((d) => d.status === "activa").length;
  const pausadas = data.deals.filter((d) => EN_CARTERA.includes(d.status) && d.status === "pausada").length;
  const equipo = useMemo(
    () =>
      data.people
        .map((p) => ({ ...produccion(data.shares, p.id, periodo), name: p.name }))
        .filter((p) => p.brutoCerrado || p.brutoEnCurso)
        .sort((a, b) => b.brutoCerrado - a.brutoCerrado)
        .slice(0, 5),
    [data, periodo],
  );

  return (
    <>
      <PageHeader eyebrow="Brea Propiedades" title="General" lede="Lo cerrado cuenta en su mes de cobro (Mes impacto). Tres Arroyos (Gonza 3A) va aparte." actions={<SelectorDePeriodo />} wide />

      <section className="px-5 pt-10 md:px-10 md:pt-12">
        <div className="mx-auto grid max-w-[1320px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador etiqueta="Neto para Brea" valor={usd(r.brea)} actual={r.brea} previo={previo.brea} contraQue={contra} />
          <Indicador etiqueta="Facturación bruta" valor={usd(r.bruto)} actual={r.bruto} previo={previo.bruto} contraQue={contra} />
          <Indicador etiqueta="Operaciones cerradas" valor={numero(r.operaciones)} actual={r.operaciones} previo={previo.operaciones} contraQue={contra} />
          <Indicador etiqueta="Volumen operado" valor={usd(r.volumen)} actual={r.volumen} previo={previo.volumen} contraQue={contra} detalle="ventas y compras" />
        </div>
      </section>

      <section className="px-5 pt-3 md:px-10">
        <div className="stage-grid relative mx-auto max-w-[1320px] overflow-hidden rounded-panel bg-stage px-6 py-7 text-stage-ink shadow-studio md:px-8">
          <Halos />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] md:items-end">
            <div>
              <div className="text-meta font-medium text-stage-3">Lo que viene</div>
              <p className="mt-2 max-w-[36ch] text-base text-stage-3">
                Reservadas y con firma pautada. Todavía no se cobró: no suma arriba.
              </p>
            </div>
            <div>
              <div className="text-meta text-stage-3">Facturación en curso</div>
              <div className="mt-1 font-display text-h2 font-semibold tracking-[-.025em] tnum">{usd(r.enCursoBruto)}</div>
            </div>
            <div>
              <div className="text-meta text-stage-3">Para Brea</div>
              <div className="mt-1 font-display text-h2 font-semibold tracking-[-.025em] tnum">{usd(r.enCursoBrea)}</div>
            </div>
            <div>
              <div className="text-meta text-stage-3">Operaciones</div>
              <div className="mt-1 font-display text-h2 font-semibold tracking-[-.025em] tnum">{numero(r.enCursoOperaciones)}</div>
            </div>
          </div>
        </div>
      </section>

      <Seccion titulo={`Facturación bruta por mes · ${periodo.anio}`} bajada="Pasá el mouse por un mes para ver el monto. Los meses del período elegido van en negro.">
        <BarrasPorMes meses={porMes(data, periodo.anio, (d) => d.gross)} enPeriodo={(m) => contieneMes(periodo, m)} etiqueta="Facturación bruta" />
      </Seccion>

      <div className="mx-auto grid max-w-[1320px] lg:grid-cols-2">
        <Seccion titulo="A dónde va cada dólar" bajada={`De ${usd(r.bruto)} facturados en ${nombre(periodo)}.`} className="lg:pr-5">
          <div className="rounded-panel bg-paper-raised p-2 shadow-card">
            <Reparto
              total={r.bruto}
              porciones={[
                { clave: "productores", etiqueta: "Productores", valor: r.productores, ayuda: "% de cada uno sobre su bruto" },
                { clave: "agentes", etiqueta: "Agentes", valor: r.agentes, ayuda: "en operaciones compartidas" },
                { clave: "lideres", etiqueta: "Líderes", valor: r.lideres, ayuda: "15 % del bruto del productor" },
                { clave: "gerencia", etiqueta: "Gerencia", valor: r.gerencia, ayuda: "45 % de lo que queda" },
                { clave: "brea", etiqueta: "Brea", valor: r.brea, destacada: true },
              ]}
            />
          </div>
        </Seccion>

        <Seccion titulo="Resultado neto" bajada="Lo que le queda a Brea después de los costos." className="lg:pl-5">
          <div className="flex h-[calc(100%-4.5rem)] flex-col justify-between gap-6 rounded-panel bg-paper-raised p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="label">Neto Brea</div>
                <div className="mt-1 text-h3 font-display font-semibold text-ink tnum">{usd(r.brea)}</div>
              </div>
              <div>
                <div className="label">Costos</div>
                <div className="mt-1 text-h3 font-display font-semibold text-ink-4">Sin cargar</div>
              </div>
              <div>
                <div className="label">Resultado</div>
                <div className="mt-1 text-h3 font-display font-semibold text-ink-4">—</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-control bg-paper-sunken p-4">
              <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} aria-hidden />
              <p className="text-meta text-ink-2">
                La planilla todavía no tiene costos. Con una pestaña Costos (mes, rubro, monto) acá aparece el resultado de cada mes y su comparación con el anterior.
              </p>
            </div>
          </div>
        </Seccion>
      </div>

      <Seccion
        titulo="Movimiento de la cartera"
        bajada={`${numero(cartera)} propiedades activas y ${numero(pausadas)} pausadas hoy. Las altas cuentan por fecha de ingreso; reservas y bajas, por su fecha.`}
        acciones={
          <Segmented<Corte>
            ariaLabel="Corte del movimiento"
            size="sm"
            value={corte}
            onChange={setCorte}
            options={[
              { value: "semana", label: "Semana" },
              { value: "quincena", label: "Quincena" },
              { value: "mes", label: "Mes" },
            ]}
          />
        }
      >
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Indicador etiqueta={`Altas · ${nombre(periodo)}`} valor={numero(r.altas)} actual={r.altas} previo={previo.altas} contraQue={contra} />
          <Indicador etiqueta={`Reservas · ${nombre(periodo)}`} valor={numero(r.reservas)} actual={r.reservas} previo={previo.reservas} contraQue={contra} />
          <Indicador etiqueta={`Bajas · ${nombre(periodo)}`} valor={numero(r.bajas)} actual={r.bajas} previo={previo.bajas} contraQue={contra} />
        </div>
        <MovimientoDeCartera filas={filas} />
      </Seccion>

      <Seccion
        titulo="Producción del equipo"
        bajada={`Producción bruta de cada persona en ${nombre(periodo)}, sumando lo que hizo como productor, agente y líder.`}
        acciones={
          <Button asChild variant="quiet" size="sm">
            <Link to="/agentes">
              Ver a todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <div className="rounded-panel bg-paper-raised p-2 shadow-card">
          <Reparto
            total={equipo.reduce((a, p) => a + p.brutoCerrado, 0)}
            porciones={equipo.map((p) => ({ clave: p.person, etiqueta: p.name, valor: p.brutoCerrado, ayuda: p.brutoEnCurso ? `${usd(p.brutoEnCurso)} en curso` : undefined }))}
          />
        </div>
      </Seccion>
      <div className="h-16" />
    </>
  );
}
