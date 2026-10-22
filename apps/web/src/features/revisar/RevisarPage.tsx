import { useMemo } from "react";
import { CalendarClock, Coins, History, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Seccion } from "@/components/tablero/Indicador";
import { Chip } from "@/components/ui/Chip";
import type { Issue } from "@/dominio/tipos";
import { useSesion } from "@/sesion";

const FALTANTES = [
  { icon: Receipt, titulo: "Costos", detalle: "Sin costos no hay resultado neto. Alcanza con una pestaña de mes, rubro y monto." },
  { icon: History, titulo: "Historial de precios", detalle: "Hoy se pisa el precio publicado. Una fila por cambio deja ver cada ajuste." },
  { icon: CalendarClock, titulo: "Fecha de cada cambio de estado", detalle: "Reserva y baja comparten columna, y la venta no tiene fecha propia. Con una columna por estado se cuentan bien por semana." },
  { icon: Coins, titulo: "Moneda", detalle: "Algunos alquileres mezclan pesos y dólares. Una columna de moneda evita negociaciones de 99 %." },
];

function Lista({ issues, mostrarHoja }: { issues: Issue[]; mostrarHoja?: boolean }) {
  return (
    <ul className="space-y-1">
      {issues.map((i, n) => (
        <li key={n} className="grid gap-x-4 gap-y-1 rounded-panel bg-paper-raised px-4 py-3 md:grid-cols-[16rem_minmax(0,1fr)] md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Chip tone="muted" mono>
              fila {i.row}
            </Chip>
            <span className="truncate text-base font-medium text-ink">{i.property}</span>
          </div>
          <div className="text-base text-ink-2">
            {mostrarHoja && i.sheet && <span className="text-ink-3">Hoja {i.sheet} · </span>}
            {i.detail}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RevisarPage() {
  const { data } = useSesion();
  const grupos = useMemo(
    () => ({
      copia: data.issues.filter((i) => i.kind === "copia"),
      formula: data.issues.filter((i) => i.kind === "formula"),
      datos: data.issues.filter((i) => i.kind === "fecha" || i.kind === "moneda"),
    }),
    [data],
  );

  return (
    <>
      <PageHeader
        eyebrow="Planilla"
        title="Para revisar"
        lede={`${data.issues.length} cosas que hoy hacen que dos personas lleguen a números distintos. Ordenarlas es lo que vuelve confiable a este tablero.`}
        wide
      />

      <Seccion titulo="Lo que falta cargar" bajada="Cuatro pedidos del tablero que la planilla todavía no puede responder.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FALTANTES.map(({ icon: Icon, titulo, detalle }) => (
            <div key={titulo} className="rounded-panel bg-paper-raised p-5 shadow-card">
              <Icon className="h-[22px] w-[22px] text-ink-3" strokeWidth={1.6} aria-hidden />
              <div className="mt-3 font-display text-h3 font-semibold text-ink">{titulo}</div>
              <p className="mt-1 text-meta text-ink-2">{detalle}</p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion
        titulo="La misma operación, montos distintos"
        bajada="Las hojas por agente son copias hechas a mano de la maestra, y con el tiempo se separaron. Por eso la producción de cada uno no cierra."
      >
        <Lista issues={grupos.copia} mostrarHoja />
      </Seccion>

      <Seccion titulo="Fórmulas cambiadas a mano" bajada="Filas de la maestra donde la fórmula no es la del resto de la columna. Algunas son bolsas o acuerdos especiales; conviene que pasen a ser una regla.">
        <Lista issues={grupos.formula} />
      </Seccion>

      <Seccion titulo="Datos faltantes o raros">
        <Lista issues={grupos.datos} />
      </Seccion>
      <div className="h-16" />
    </>
  );
}
