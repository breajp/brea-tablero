import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { cambiarGranularidad, mover, nombre, type Granularidad } from "@/dominio/periodo";
import { ultimoMes, useSesion } from "@/sesion";

export function SelectorDePeriodo() {
  const { periodo, setPeriodo, data } = useSesion();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<Granularidad>
        ariaLabel="Período"
        size="sm"
        value={periodo.granularidad}
        onChange={(g) => setPeriodo(cambiarGranularidad(periodo, g, ultimoMes(data)))}
        options={[
          { value: "mes", label: "Mes" },
          { value: "trimestre", label: "Trimestre" },
          { value: "anio", label: "Año" },
        ]}
      />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Período anterior" onClick={() => setPeriodo(mover(periodo, -1))}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[10.5rem] text-center text-base font-medium text-ink first-letter:uppercase tnum">
          {nombre(periodo)}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Período siguiente" onClick={() => setPeriodo(mover(periodo, 1))}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
