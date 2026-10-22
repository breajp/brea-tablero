import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Mes, Movimiento } from "@/dominio/calculos";
import { MESES_CORTOS } from "@/dominio/periodo";
import { cn } from "@/lib/cn";
import { numero, usd, usdCorto } from "@/lib/formato";

const ALTO = 190;

// Lo que todavía no se cobró se dibuja rayado: es el mismo monto, pero no es plata en la mano.
const RAYADO = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--color-ink-4) 0 1.5px, transparent 1.5px 6px)",
};

function escala(max: number): number[] {
  if (max <= 0) return [0];
  const paso = 10 ** Math.floor(Math.log10(max / 2));
  const bonito = [1, 2, 2.5, 5, 10].map((k) => k * paso).find((p) => max / p <= 4) ?? paso * 10;
  return Array.from({ length: Math.ceil(max / bonito) + 1 }, (_, i) => i * bonito);
}

export function BarrasPorMes({
  meses,
  enPeriodo,
  etiqueta,
}: {
  meses: Mes[];
  enPeriodo: (mes: string) => boolean;
  etiqueta: string;
}) {
  const ticks = escala(Math.max(...meses.map((m) => m.cerrado + m.enCurso), 1));
  const tope = ticks[ticks.length - 1] || 1;
  return (
    <div className="rounded-panel bg-paper-raised p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-meta text-ink-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-ink" /> Cerrado en el período
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-rule-strong" /> Cerrado, otros meses
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] border border-ink-4" style={RAYADO} /> Reservado o a la firma
        </span>
      </div>
      <div className="flex gap-3">
        <div className="relative w-14 shrink-0" style={{ height: ALTO }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2 text-micro text-ink-4 tnum" style={{ bottom: (t / tope) * ALTO }}>
              {usdCorto(t).replace("US$ ", "")}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <span key={t} aria-hidden className="absolute inset-x-0 border-t border-rule/70" style={{ bottom: (t / tope) * ALTO }} />
          ))}
          <div className="relative grid grid-cols-12 gap-1 sm:gap-2" style={{ height: ALTO }}>
            {meses.map((m, i) => {
              const elegido = enPeriodo(m.mes);
              return (
                <Tooltip
                  key={m.mes}
                  label={
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium capitalize">{MESES_CORTOS[i]}</span>
                      <span className="tnum">Cerrado {usd(m.cerrado)}</span>
                      {m.enCurso > 0 && <span className="tnum">En curso {usd(m.enCurso)}</span>}
                    </span>
                  }
                >
                  <button
                    type="button"
                    aria-label={`${etiqueta} de ${MESES_CORTOS[i]}: ${usd(m.cerrado)}${m.enCurso ? `, más ${usd(m.enCurso)} en curso` : ""}`}
                    className="group flex h-full flex-col justify-end rounded-[4px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-ember"
                  >
                    {m.enCurso > 0 && (
                      <span
                        className="block rounded-t-[4px] border border-b-0 border-ink-4"
                        style={{ ...RAYADO, height: Math.max(3, (m.enCurso / tope) * ALTO) }}
                      />
                    )}
                    {m.cerrado > 0 && (
                      <span
                        className={cn(
                          "block transition-colors duration-150",
                          m.enCurso > 0 ? "mt-[2px]" : "rounded-t-[4px]",
                          elegido ? "bg-ink group-hover:bg-ink-2" : "bg-rule-strong group-hover:bg-ink-4",
                        )}
                        style={{ height: Math.max(3, (m.cerrado / tope) * ALTO) }}
                      />
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-12 gap-1 sm:gap-2" aria-hidden>
            {meses.map((m, i) => (
              <span key={m.mes} className={cn("text-center text-micro", enPeriodo(m.mes) ? "font-medium text-ink" : "text-ink-4")}>
                <span className="sm:hidden">{MESES_CORTOS[i][0].toUpperCase()}</span>
                <span className="hidden sm:inline">{MESES_CORTOS[i]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface Porcion {
  clave: string;
  etiqueta: string;
  valor: number;
  ayuda?: string;
  destacada?: boolean;
}

export function Reparto({ porciones, total }: { porciones: Porcion[]; total: number }) {
  return (
    <div className="space-y-1">
      {porciones.map((p) => {
        const parte = total ? p.valor / total : 0;
        return (
          <div key={p.clave} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-control px-3 py-2.5 hover:bg-paper-sunken/60 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_8rem_3.5rem]">
            <div className="min-w-0">
              <div className={cn("truncate text-base", p.destacada ? "font-semibold text-ink" : "text-ink-2")}>{p.etiqueta}</div>
              {p.ayuda && <div className="truncate text-meta text-ink-4">{p.ayuda}</div>}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-paper-sunken" aria-hidden>
              <div
                className={cn("h-full rounded-full", p.destacada ? "bg-ink" : "bg-ink-3")}
                style={{ width: `${Math.max(parte * 100, p.valor > 0 ? 1.5 : 0)}%` }}
              />
            </div>
            <div className="text-right text-base text-ink tnum">{usd(p.valor)}</div>
            <div className="hidden text-right text-meta text-ink-3 tnum sm:block">{Math.round(parte * 100)} %</div>
          </div>
        );
      })}
    </div>
  );
}

const SERIES = [
  { clave: "altas", etiqueta: "Altas", clase: "bg-ink" },
  { clave: "reservas", etiqueta: "Reservas", clase: "bg-warn" },
  { clave: "bajas", etiqueta: "Bajas", clase: "bg-fail" },
] as const;

export function MovimientoDeCartera({ filas }: { filas: Movimiento[] }) {
  const tope = Math.max(...filas.flatMap((f) => [f.altas, f.reservas, f.bajas]), 1);
  const alto = 150;
  return (
    <div className="rounded-panel bg-paper-raised p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-meta text-ink-2">
        {SERIES.map((s) => (
          <span key={s.clave} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-[2px]", s.clase)} /> {s.etiqueta}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex items-end gap-2 border-b border-rule" style={{ height: alto }}>
            {filas.map((f) => (
              <Tooltip
                key={f.clave}
                label={
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{f.etiqueta}</span>
                    {SERIES.map((s) => (
                      <span key={s.clave} className="tnum">
                        {s.etiqueta} {numero(f[s.clave])}
                      </span>
                    ))}
                  </span>
                }
              >
                <button
                  type="button"
                  aria-label={`${f.etiqueta}: ${f.altas} altas, ${f.reservas} reservas, ${f.bajas} bajas`}
                  className="flex h-full flex-1 items-end justify-center gap-[2px] rounded-t-[4px] hover:bg-paper-sunken/60 focus-visible:outline-2 focus-visible:outline-ember"
                >
                  {SERIES.map((s) => (
                    <span
                      key={s.clave}
                      className={cn("w-full max-w-[10px] rounded-t-[3px]", s.clase, f[s.clave] === 0 && "opacity-0")}
                      style={{ height: Math.max(2, (f[s.clave] / tope) * (alto - 8)) }}
                    />
                  ))}
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="mt-2 flex gap-2" aria-hidden>
            {filas.map((f) => (
              <span key={f.clave} className="flex-1 text-center text-micro text-ink-4">
                {f.etiqueta}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dato({ etiqueta, children, className }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="label">{etiqueta}</span>
      <span className="text-base text-ink tnum">{children}</span>
    </div>
  );
}
