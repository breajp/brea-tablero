import { useMemo } from "react";
import { CalendarClock, History, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Seccion } from "@/components/tablero/Indicador";
import { Chip } from "@/components/ui/Chip";
import type { Issue } from "@/dominio/tipos";
import { useSesion } from "@/sesion";

function Lista({ issues, mostrarHoja }: { issues: Issue[]; mostrarHoja?: boolean }) {
  return (
    <ul className="space-y-1">
      {issues.map((i, n) => (
        <li key={n} className="grid gap-x-4 gap-y-1 rounded-panel bg-paper-raised px-4 py-3 md:grid-cols-[16rem_minmax(0,1fr)] md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {i.row > 0 && (
              <Chip tone="muted" mono className="shrink-0 whitespace-nowrap">
                fila {i.row}
              </Chip>
            )}
            <span className="truncate text-base font-medium text-ink">{i.property}</span>
          </div>
          <div className="min-w-0">
            <p className="text-base text-ink-2">
              {mostrarHoja && i.sheet && <span className="text-ink-3">Hoja {i.sheet} · </span>}
              {i.detail}
            </p>
            {i.note && <p className="mt-1 text-meta text-ink-3">Nota del equipo: {i.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RevisarPage() {
  const { data } = useSesion();
  const g = useMemo(() => {
    // Los avisos de forma de la planilla van aparte: no son números que no cierran.
    const pendientes = data.issues.filter((i) => !i.note && i.kind !== "planilla");
    return {
      pendientes: pendientes.length,
      planilla: data.issues.filter((i) => i.kind === "planilla"),
      explicados: data.issues.filter((i) => i.note),
      regla: pendientes.filter((i) => i.kind === "regla"),
      copia: pendientes.filter((i) => i.kind === "copia"),
      formula: pendientes.filter((i) => i.kind === "formula"),
      datos: pendientes.filter((i) => i.kind === "fecha" || i.kind === "moneda"),
    };
  }, [data]);

  const faltantes = [
    !data.costs?.length && { icon: Receipt, titulo: "Costos", detalle: "Van en la pestaña Costos, en pesos y con el dólar del mes. Con eso aparece el resultado neto en General." },
    !data.priceChanges?.length && { icon: History, titulo: "Cambios de precio", detalle: "Cada cambio, una fila en la pestaña Precios: el agente lo avisa por mail y se carga ahí." },
    { icon: CalendarClock, titulo: "Fecha de cada cambio de estado", detalle: "Reserva y baja comparten columna y la venta no tiene fecha propia. Con una columna por estado se cuentan bien por semana." },
  ].filter(Boolean) as { icon: typeof Receipt; titulo: string; detalle: string }[];

  return (
    <>
      <PageHeader
        eyebrow="Planilla"
        title="Para revisar"
        lede={
          g.pendientes
            ? `${g.pendientes} cosas que hoy hacen que dos personas lleguen a números distintos.${g.explicados.length ? ` Otras ${g.explicados.length} están explicadas por el equipo.` : ""}`
            : `No queda nada pendiente.${g.explicados.length ? ` Hay ${g.explicados.length} casos particulares explicados por el equipo.` : ""}`
        }
        wide
      />

      {faltantes.length > 0 && (
        <Seccion titulo="Lo que falta cargar" bajada="Pedidos del tablero que la planilla todavía no puede responder.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {faltantes.map(({ icon: Icon, titulo, detalle }) => (
              <div key={titulo} className="rounded-panel bg-paper-raised p-5 shadow-card">
                <Icon className="h-[22px] w-[22px] text-ink-3" strokeWidth={1.6} aria-hidden />
                <div className="mt-3 font-display text-h3 font-semibold text-ink">{titulo}</div>
                <p className="mt-1 text-meta text-ink-2">{detalle}</p>
              </div>
            ))}
          </div>
        </Seccion>
      )}

      {g.planilla.length > 0 && (
        <Seccion titulo="Cómo está cargada la planilla" bajada="Lo que hace que el tablero lea mal una pestaña: encabezados, fechas, nombres que no están en Personas y usuarios.">
          <Lista issues={g.planilla} />
        </Seccion>
      )}

      {g.regla.length > 0 && (
        <Seccion titulo="Reglas para confirmar" bajada="Donde la hoja 2026 y la planilla de comisiones dicen cosas distintas.">
          <Lista issues={g.regla} />
        </Seccion>
      )}

      {g.copia.length > 0 && (
        <Seccion titulo="La misma operación, montos distintos" bajada="Las hojas por agente son copias hechas a mano de la maestra y se fueron separando.">
          <Lista issues={g.copia} mostrarHoja />
        </Seccion>
      )}

      {g.formula.length > 0 && (
        <Seccion titulo="Fórmulas cambiadas a mano" bajada="Filas de la maestra donde la fórmula no es la del resto de la columna. Si es a propósito, explicalo en la columna NOTA de Para revisar.">
          <Lista issues={g.formula} />
        </Seccion>
      )}

      {g.datos.length > 0 && (
        <Seccion titulo="Datos faltantes o raros">
          <Lista issues={g.datos} />
        </Seccion>
      )}

      {g.explicados.length > 0 && (
        <Seccion titulo="Casos particulares, con explicación" bajada="Están así a propósito: el equipo lo explicó en la columna NOTA. Conviene ver cómo resolverlos si van a seguir pasando.">
          <Lista issues={g.explicados} mostrarHoja />
        </Seccion>
      )}
      <div className="h-16" />
    </>
  );
}
