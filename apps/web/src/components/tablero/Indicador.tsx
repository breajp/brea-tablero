import type { ReactNode } from "react";
import { variacion } from "@/dominio/calculos";
import { cn } from "@/lib/cn";

export function Indicador({
  etiqueta,
  valor,
  actual,
  previo,
  contraQue,
  detalle,
}: {
  etiqueta: string;
  valor: ReactNode;
  actual?: number;
  // null: hay con qué comparar en teoría, pero la planilla no llega tan atrás.
  previo?: number | null;
  contraQue?: string;
  detalle?: ReactNode;
}) {
  const v = actual !== undefined && previo !== undefined && previo !== null ? variacion(actual, previo) : null;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-panel bg-paper-raised p-5 shadow-card">
      <span className="label">{etiqueta}</span>
      <span className="font-display text-h2 font-semibold tracking-[-.025em] text-ink tnum">{valor}</span>
      <span className="text-meta text-ink-3">
        {v !== null ? (
          <>
            <span className={cn("font-medium tnum", v >= 0 ? "text-pass" : "text-fail")}>
              {v >= 0 ? "▲" : "▼"} {Math.abs(Math.round(v * 100))} %
            </span>{" "}
            contra {contraQue}
          </>
        ) : previo !== undefined && contraQue ? (
          <>{previo === null ? `Sin histórico para comparar con ${contraQue}` : `Sin datos para ${contraQue}`}</>
        ) : null}
        {detalle && (v !== null || previo !== undefined) && " · "}
        {detalle}
      </span>
    </div>
  );
}

export function Seccion({
  titulo,
  bajada,
  acciones,
  children,
  className,
}: {
  titulo: string;
  bajada?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-5 pt-12 md:px-10 md:pt-14", className)}>
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-h3 font-semibold text-ink">{titulo}</h2>
            {bajada && <p className="mt-1 max-w-[70ch] text-base text-ink-3">{bajada}</p>}
          </div>
          {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
