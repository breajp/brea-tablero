import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Periodo } from "@/dominio/periodo";
import type { Tablero, Usuario } from "@/dominio/tipos";

interface Sesion {
  user: Usuario;
  data: Tablero;
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  salir: () => void;
  esAdmin: boolean;
  esLider: boolean;
}

const Contexto = createContext<Sesion | null>(null);
const CLAVE = "brea-tablero:sesion";

interface Abierto {
  user: Usuario;
  data: Tablero;
}

// La sesión dura lo que la pestaña: lo descifrado vive en sessionStorage y se va al cerrarla.
export function leerSesionGuardada(): Abierto | null {
  try {
    const s = sessionStorage.getItem(CLAVE);
    return s ? (JSON.parse(s) as Abierto) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(a: Abierto) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(a));
  } catch {}
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {}
}

export function ultimoMes(data: Tablero): string {
  return data.generatedAt.slice(0, 7);
}

export function SesionProvider({ abierto, onSalir, children }: { abierto: Abierto; onSalir: () => void; children: ReactNode }) {
  const [periodo, setPeriodo] = useState<Periodo>(() => ({
    granularidad: "anio",
    anio: Number(abierto.data.generatedAt.slice(0, 4)),
    indice: 1,
  }));
  const salir = useCallback(() => {
    borrarSesion();
    onSalir();
  }, [onSalir]);
  const valor = useMemo(
    () => ({ ...abierto, periodo, setPeriodo, salir, esAdmin: abierto.user.role === "admin", esLider: abierto.user.role === "lider" }),
    [abierto, periodo, salir],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): Sesion {
  const s = useContext(Contexto);
  if (!s) throw new Error("useSesion fuera de SesionProvider");
  return s;
}

export function useNombreDe() {
  const { data } = useSesion();
  return useCallback((id: string | null) => (id ? (data.people.find((p) => p.id === id)?.name ?? id) : "—"), [data]);
}
