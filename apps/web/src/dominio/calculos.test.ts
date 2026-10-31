import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { deBuenosAires, movimiento, resumen } from "./calculos";
import type { Tablero } from "./tipos";

const ruta = resolve(__dirname, "../../../../datos/tablero.json");

// El repo es público: acá no van cifras reales. Los totales los controla datos/extraer.py en cada
// actualización contra Producción y Resumen mensual de la planilla, y avisa en Revisar si no coinciden.
describe.runIf(existsSync(ruta))("con la planilla real", () => {
  // Sin la planilla (en el CI no está: es privada) el describe se salta, pero su cuerpo igual corre.
  const t: Tablero = existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8")) : ({} as Tablero);
  const anio = { granularidad: "anio" as const, anio: 2026, indice: 1 };

  it("el reparto suma exactamente el bruto", () => {
    for (const r of [resumen(t, anio), resumen(deBuenosAires(t), anio)]) {
      expect(Math.round(r.productores + r.agentes + r.lideres + r.gerencia + r.brea)).toBe(Math.round(r.bruto));
    }
  });
});

describe("cortes de período", () => {
  const t = { deals: [], shares: [], generatedAt: "2026-10-21" } as unknown as Tablero;

  it("arma cortes de semana y quincena sin huecos", () => {
    expect(movimiento(t, "quincena", "2026-10-21", 4).map((m) => m.clave)).toEqual(["2026-09-1", "2026-09-2", "2026-10-1", "2026-10-2"]);
    expect(movimiento(t, "semana", "2026-10-21", 3).map((m) => m.clave)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
  });
});
