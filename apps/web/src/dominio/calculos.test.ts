import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { movimiento, produccion, resumen } from "./calculos";
import type { Tablero } from "./tipos";

const ruta = resolve(__dirname, "../../../../datos/tablero.json");

// Los totales de la hoja OFICINA de la planilla: si el tablero no da esto, algo se rompió.
describe.runIf(existsSync(ruta))("con la planilla real", () => {
  // Sin la planilla (en el CI no está: es privada) el describe se salta, pero su cuerpo igual corre.
  const t: Tablero = existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8")) : ({} as Tablero);
  const anio = { granularidad: "anio" as const, anio: 2026, indice: 1 };

  // Sheet al 22/10/2026. El neto coincide con la hoja OFICINA; el bruto tiene US$ 3.600 más
  // porque OFICINA no copió Calle 29 1481 Claromecó, que en la maestra ya está vendida.
  it("cierra con el neto de la hoja OFICINA", () => {
    const r = resumen(t, anio);
    expect(Math.round(r.bruto)).toBe(205494);
    expect(Math.round(r.brea)).toBe(57607);
    expect(Math.round(r.productores + r.agentes + r.lideres + r.gerencia + r.brea)).toBe(205494);
  });

  it("cuenta una sola vez cada operación en bolsa", () => {
    // Las bolsas cuentan una vez; Calle 29 al 1000 se cerró en 2025 y 1810 191 no tiene fecha.
    const r = resumen(t, anio);
    expect(r.operaciones).toBe(31);
  });

  it("suma la producción de Flor en sus tres roles", () => {
    const p = produccion(t.shares, "flor", anio);
    expect(Math.round(p.netoCerrado)).toBe(60218);
  });

  it("arma cortes de semana y quincena sin huecos", () => {
    expect(movimiento(t, "quincena", "2026-10-21", 4).map((m) => m.clave)).toEqual(["2026-09-1", "2026-09-2", "2026-10-1", "2026-10-2"]);
    expect(movimiento(t, "semana", "2026-10-21", 3).map((m) => m.clave)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
  });
});
