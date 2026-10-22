import type { CSSProperties, SVGProps } from "react";
import { cn } from "@/lib/cn";

// Íconos del riel. Un ícono de sección se dibuja a trazo y tiene UNA forma que
// se rellena de ember cuando la sección está activa: es la única aparición del
// color de marca en la navegación, y dice "estás acá" sin un fondo de color.
// Para agregar una sección, copiá la forma de estos: trazo de 1.75, y la forma
// que se llena con `relleno(activo, desde)`.

export interface IconoDeRielProps {
  className?: string;
  strokeWidth?: number;
  activo?: boolean;
}

const base = (strokeWidth = 1.75) => ({
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function relleno(activo: boolean | undefined, desde: string, origen = "bottom"): SVGProps<never> {
  return {
    stroke: "none",
    className: cn("transition-[fill,transform] duration-300 ease-out", activo && "fill-ember"),
    style: {
      transformBox: "fill-box",
      transformOrigin: origen,
      transform: activo ? "none" : desde,
      fill: activo ? undefined : "transparent",
      transitionDelay: activo ? "60ms" : "0ms",
    } as CSSProperties,
  };
}

export function InicioIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="6.5" y="13" width="11" height="7.5" rx="1" {...relleno(activo, "scaleY(0)")} />
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v10.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9" />
    </svg>
  );
}

export function ArchivosIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <path d="M4.5 18.5 8.5 13l3.5 3.5 2.5-2.5 5 4.5z" {...relleno(activo, "scaleY(0)")} />
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="m3.5 17.5 5-5.5 3.5 3.5 2.5-2.5 6 6" />
      <circle cx="15.5" cy="9" r="1.5" />
    </svg>
  );
}

export function UsoIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="4" y="12" width="4" height="8" rx="1" {...relleno(activo, "scaleY(0)")} />
      <rect x="4" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="7" width="4" height="13" rx="1" />
      <rect x="16" y="3.5" width="4" height="16.5" rx="1" />
    </svg>
  );
}

export function AgentesIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <circle cx="9" cy="8" r="3.2" {...relleno(activo, "scale(0)", "center")} />
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.5 14.8c1.6.7 2.7 2.3 3 4.7" />
    </svg>
  );
}

export function OperacionesIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="7" y="8.5" width="10" height="3.5" rx=".8" {...relleno(activo, "scaleX(0)", "left")} />
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M7 8.5h10v3.5H7zM7 15.5h6" />
    </svg>
  );
}

export function PropiedadesIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <rect x="10" y="14" width="4" height="6.5" {...relleno(activo, "scaleY(0)")} />
      <path d="M4.5 20.5V8.5l7.5-5 7.5 5v12" />
      <path d="M3 20.5h18M10 20.5V14h4v6.5" />
    </svg>
  );
}

export function RevisarIcon({ className, strokeWidth, activo }: IconoDeRielProps) {
  return (
    <svg className={className} {...base(strokeWidth)}>
      <circle cx="12" cy="12" r="8.5" {...relleno(activo, "scale(0)", "center")} />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5" className={activo ? "stroke-paper-raised" : undefined} />
      <path d="M12 16.3v.2" className={activo ? "stroke-paper-raised" : undefined} />
    </svg>
  );
}
