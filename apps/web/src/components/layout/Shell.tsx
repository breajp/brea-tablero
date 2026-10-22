import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useMatch, useResolvedPath } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { LogOut, PanelLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Mark } from "@/components/ui/Mark";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { navegacionPara, type ItemDeNavegacion } from "@/navegacion";
import { useSesion } from "@/sesion";
import { PRODUCTO } from "@/producto";

function useEnLaSeccion(to: string, end: boolean, tambien?: string): boolean {
  const resolved = useResolvedPath(to);
  const propia = useMatch({ path: resolved.pathname, end }) !== null;
  // Los hooks no se pueden llamar condicionalmente: sin prefijo aparte esto
  // vuelve a preguntar por la propia ruta y el OR no cambia nada.
  const aparte =
    useMatch({ path: tambien ?? resolved.pathname, end: tambien ? false : end }) !== null;

  return propia || aparte;
}

const RAIL_COLLAPSED = 60;
const RAIL_EXPANDED = 216;
const STORAGE_KEY = `${PRODUCTO.slug}:rail-expanded`;

function RailLink({ to, label, icon: Icon, end, tambien, expanded }: ItemDeNavegacion & { expanded: boolean }) {
  // El estado activo se calcula acá en vez de usar el render-prop de NavLink:
  // el Slot de Radix, que es lo que hace `asChild` del tooltip, no puede
  // clonar un elemento cuyos children son una función.
  const active = useEnLaSeccion(to, end, tambien);

  // Link y no NavLink: el aria-current de NavLink solo mira su propia ruta, y
  // el detalle de una nota tiene que anunciar "Notas" como sección actual.
  const link = (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-11 items-center rounded-control transition-colors duration-150",
        expanded ? "w-full gap-3 px-3" : "w-11 justify-center",
        active ? "text-ink" : "text-ink-3 hover:bg-paper-sunken/70 hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="rail-active"
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 -z-10 rounded-control bg-paper-sunken"
        />
      )}
      <Icon className="relative h-[21px] w-[21px] shrink-0" strokeWidth={1.75} activo={active} />
      <span className={cn("relative truncate text-base", expanded ? "font-medium" : "sr-only")}>
        {label}
      </span>
    </Link>
  );

  return expanded ? (
    link
  ) : (
    <Tooltip label={label} side="right">
      {link}
    </Tooltip>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, esAdmin, salir } = useSesion();
  const NAV = navegacionPara(esAdmin);
  // La animación de entrada va por pantalla, no por URL: un cambio que no es
  // otra pantalla (una solapa, un parámetro) no tiene que repetirla. Si una
  // sección tiene sub-rutas que son la misma pantalla, normalizalas acá.
  const pantalla = pathname;

  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setExpanded((v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      )
        return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const rail = expanded ? RAIL_EXPANDED : RAIL_COLLAPSED;
  const quieto = useReducedMotion() ?? false;

  // Cambiar de pantalla lleva el foco al contenido nuevo: si no, queda en el
  // link del riel y el lector de pantalla no se entera de que algo cambió. La
  // primera carga no: ahí el foco es del navegador y del link para saltar. Si
  // la pantalla ya puso el foco en algo suyo (un autoFocus), se respeta.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const main = document.getElementById("contenido");
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [pantalla]);

  return (
    <div className="paper-grain min-h-screen bg-paper" style={{ ["--rail" as string]: `${rail}px` }}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]
          focus:rounded-control focus:bg-ink focus:px-3 focus:py-2 focus:text-meta focus:text-paper-raised"
      >
        Saltar al contenido
      </a>

      <nav
        aria-label="Principal"
        style={{ width: rail }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col justify-between bg-paper-raised/80
          py-4 shadow-rail backdrop-blur-xs transition-[width] duration-200 ease-out md:flex"
      >
        <div className={cn("flex flex-col gap-6", expanded ? "items-stretch px-3" : "items-center")}>
          <NavLink
            to="/"
            aria-label={PRODUCTO.nombre}
            className={cn(
              "flex items-center text-ink",
              expanded ? "h-11 gap-3 px-3" : "h-9 justify-center",
            )}
          >
            <Mark size={36} />
            {expanded && (
              <span
                title={PRODUCTO.nombre}
                className="min-w-0 truncate font-display text-[1.5rem] font-semibold leading-none tracking-[-.04em]"
              >
                {PRODUCTO.nombre}
              </span>
            )}
          </NavLink>

          <div className={cn("flex flex-col gap-1", expanded ? "items-stretch" : "items-center")}>
            {NAV.map((n) => (
              <RailLink key={n.to} {...n} expanded={expanded} />
            ))}
          </div>
        </div>

        <div className={cn("flex flex-col gap-1", expanded ? "items-stretch px-3" : "items-center")}>
          <div className={cn("mb-2 flex items-center gap-3", expanded ? "px-3" : "justify-center")}>
            <Avatar nombre={user.name} size="sm" />
            {expanded && (
              <div className="min-w-0">
                <div className="truncate text-base font-medium text-ink">{user.name}</div>
                <div className="text-meta text-ink-3">{esAdmin ? "Administra" : "Agente"}</div>
              </div>
            )}
          </div>
          <Tooltip label="Salir del tablero" side="right">
            <button
              onClick={salir}
              aria-label="Salir"
              className={cn(
                "flex h-10 items-center gap-3 rounded-control text-ink-3 transition-colors duration-150",
                "hover:bg-paper-sunken hover:text-ink",
                expanded ? "px-3" : "w-10 justify-center",
              )}
            >
              <LogOut className="h-[21px] w-[21px] shrink-0" strokeWidth={1.75} />
              {expanded && <span className="truncate text-base">Salir</span>}
            </button>
          </Tooltip>
          <Tooltip label={expanded ? "Achicar el riel" : "Expandir el riel"} side="right" shortcut="[">
            <button
              onClick={toggle}
              aria-expanded={expanded}
              aria-label={expanded ? "Achicar la navegación" : "Expandir la navegación"}
              className={cn(
                "flex h-10 items-center gap-3 rounded-control text-ink-3 transition-colors duration-150",
                "hover:bg-paper-sunken hover:text-ink",
                expanded ? "px-3" : "w-10 justify-center",
              )}
            >
              <PanelLeft
                className={cn(
                  "h-[21px] w-[21px] shrink-0 transition-transform duration-200 ease-out",
                  expanded && "rotate-180",
                )}
                strokeWidth={1.75}
              />
              {expanded && <span className="truncate text-base">Achicar</span>}
            </button>
          </Tooltip>
        </div>
      </nav>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-rule
          bg-paper-raised/95 backdrop-blur-sm md:hidden"
      >
        {NAV.map((item) => (
          <BarraLink key={item.to} {...item} />
        ))}
        <button
          onClick={salir}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-nano font-medium tracking-wide text-ink-3"
        >
          <LogOut className="h-[21px] w-[21px]" strokeWidth={1.75} aria-hidden />
          Salir
        </button>
      </nav>

      {/* La entrada de cada pantalla vive acá y no en cada página: el key por
          pantalla ya remonta esto en toda navegación, así que una sola
          animación alcanza para todas y ninguna queda distinta por accidente.
          Corta y sobria —8px— porque son páginas.

          Sin animación de salida: AnimatePresence entre rutas deja la pantalla
          colgada cuando una salida se interrumpe. La única excepción con
          fundamento, un espacio a pantalla completa en el escenario, está en
          la referencia de movimiento de la skill sistema. */}
      <motion.main
        id="contenido"
        tabIndex={-1}
        key={pantalla}
        initial={quieto ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[1] min-h-screen pb-14 transition-[padding] duration-200 ease-out outline-hidden
          md:pb-0 md:pl-[var(--rail)]"
      >
        {children}
      </motion.main>
    </div>
  );
}

function BarraLink({ to, label, icon: Icon, end, tambien }: ItemDeNavegacion) {
  const active = useEnLaSeccion(to, end, tambien);

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 text-nano font-medium tracking-wide",
        active ? "text-ink" : "text-ink-3",
      )}
    >
      {active && <span className="absolute inset-x-6 top-0 h-[2px] bg-ember" />}
      <Icon className="h-[21px] w-[21px]" strokeWidth={1.75} activo={active} />
      {label}
    </Link>
  );
}
