import { useMemo } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Seccion } from "@/components/tablero/Indicador";
import { SelectorDePeriodo } from "@/components/tablero/SelectorDePeriodo";
import { Avatar } from "@/components/ui/Avatar";
import { produccion } from "@/dominio/calculos";
import { nombre } from "@/dominio/periodo";
import { numero, tasa, usd } from "@/lib/formato";
import { useSesion } from "@/sesion";

export default function AgentesPage() {
  const { data, periodo } = useSesion();
  const filas = useMemo(
    () =>
      data.people
        .map((p) => ({ ...p, ...produccion(data.shares, p.id, periodo) }))
        .sort((a, b) => b.netoCerrado - a.netoCerrado || b.netoEnCurso - a.netoEnCurso),
    [data, periodo],
  );
  const total = filas.reduce((a, f) => a + f.netoCerrado, 0);

  return (
    <>
      <PageHeader
        eyebrow="Equipo"
        title="Agentes"
        lede="Cada persona suma lo que cobró como productor, agente y líder. Entrá a una para ver su tablero tal como lo ve ella."
        actions={<SelectorDePeriodo />}
        wide
      />
      <Seccion titulo={`Producción en ${nombre(periodo)}`} bajada={`${usd(total)} netos para el equipo.`}>
        <div className="overflow-x-auto rounded-panel bg-paper-raised shadow-card">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="text-meta text-ink-3">
                <th className="px-5 py-3 font-medium">Persona</th>
                <th className="px-3 py-3 text-right font-medium">Neto cobrado</th>
                <th className="px-3 py-3 text-right font-medium">Bruto generado</th>
                <th className="px-3 py-3 text-right font-medium">Como productor</th>
                <th className="px-3 py-3 text-right font-medium">Como agente</th>
                <th className="px-3 py-3 text-right font-medium">Como líder</th>
                <th className="px-3 py-3 text-right font-medium">En curso</th>
                <th className="px-3 py-3 text-right font-medium">Operaciones</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="group relative border-t border-rule/70 text-base text-ink-2 tnum hover:bg-paper-sunken/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-ember">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={f.name} />
                      <div className="min-w-0">
                        <Link to={`/agentes/${f.id}`} className="font-medium text-ink outline-hidden after:absolute after:inset-0">
                          {f.name}
                        </Link>
                        <div className="text-meta text-ink-4">{f.rate !== null ? `${tasa(f.rate)} como productor` : "Sin % cargado"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-ink">{usd(f.netoCerrado)}</td>
                  <td className="px-3 py-3 text-right">{usd(f.brutoCerrado)}</td>
                  <td className="px-3 py-3 text-right">{f.porRol.productor ? usd(f.porRol.productor) : "—"}</td>
                  <td className="px-3 py-3 text-right">{f.porRol.agente ? usd(f.porRol.agente) : "—"}</td>
                  <td className="px-3 py-3 text-right">{f.porRol.lider ? usd(f.porRol.lider) : "—"}</td>
                  <td className="px-3 py-3 text-right">{f.netoEnCurso ? usd(f.netoEnCurso) : "—"}</td>
                  <td className="px-3 py-3 text-right">{numero(f.operaciones)}</td>
                  <td className="pr-4 text-ink-4 group-hover:text-ink">
                    <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[80ch] text-meta text-ink-3">
          Gonza figura con poco porque lo que entra como Gonza CABA tiene 0 % de productor: esa parte queda para la oficina y se ve en Brea y Gerencia.
        </p>
      </Seccion>
      <div className="h-16" />
    </>
  );
}
