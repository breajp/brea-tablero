import type { JSX } from "react";
import {
  AgentesIcon,
  InicioIcon,
  OperacionesIcon,
  PropiedadesIcon,
  RevisarIcon,
  UsoIcon,
  type IconoDeRielProps,
} from "@/components/ui/RailIcons";

// Las secciones del producto. `tambien` es un prefijo extra que mantiene prendida la sección,
// para cuando el detalle cuelga de otra ruta que la lista.
export interface ItemDeNavegacion {
  to: string;
  label: string;
  icon: (props: IconoDeRielProps) => JSX.Element;
  end: boolean;
  tambien?: string;
}

const ADMIN: ItemDeNavegacion[] = [
  { to: "/", label: "General", icon: InicioIcon, end: true },
  { to: "/agentes", label: "Agentes", icon: AgentesIcon, end: false },
  { to: "/operaciones", label: "Operaciones", icon: OperacionesIcon, end: false },
  { to: "/propiedades", label: "Propiedades", icon: PropiedadesIcon, end: false },
  { to: "/revisar", label: "Revisar", icon: RevisarIcon, end: false },
];

const AGENTE: ItemDeNavegacion[] = [
  { to: "/", label: "Producción", icon: UsoIcon, end: true },
  { to: "/operaciones", label: "Operaciones", icon: OperacionesIcon, end: false },
  { to: "/propiedades", label: "Propiedades", icon: PropiedadesIcon, end: false },
];

export const navegacionPara = (esAdmin: boolean) => (esAdmin ? ADMIN : AGENTE);
