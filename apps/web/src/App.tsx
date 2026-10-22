import { lazy, Suspense } from "react";
import { Outlet, Route, Routes } from "react-router";
import { Shell } from "@/components/layout/Shell";
import { TooltipProvider } from "@/components/ui/Tooltip";
import AgentesPage from "@/features/agentes/AgentesPage";
import GeneralPage from "@/features/general/GeneralPage";
import OperacionesPage from "@/features/operaciones/OperacionesPage";
import ProduccionPage from "@/features/produccion/ProduccionPage";
import PropiedadesPage from "@/features/propiedades/PropiedadesPage";
import RevisarPage from "@/features/revisar/RevisarPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { useSesion } from "@/sesion";

// La guía viva del sistema existe solo en desarrollo: en el build, esta rama
// desaparece y la página no llega al bundle.
const SistemaPage = import.meta.env.DEV ? lazy(() => import("@/pages/SistemaPage")) : null;

function ConShell() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export default function App() {
  const { esAdmin } = useSesion();
  return (
    <TooltipProvider>
      <Routes>
        <Route element={<ConShell />}>
          {esAdmin ? (
            <>
              <Route path="/" element={<GeneralPage />} />
              <Route path="/agentes" element={<AgentesPage />} />
              <Route path="/agentes/:id" element={<ProduccionPage />} />
              <Route path="/revisar" element={<RevisarPage />} />
            </>
          ) : (
            <Route path="/" element={<ProduccionPage />} />
          )}
          <Route path="/operaciones" element={<OperacionesPage />} />
          <Route path="/propiedades" element={<PropiedadesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {SistemaPage && (
          <Route
            path="/sistema"
            element={
              <Suspense fallback={null}>
                <SistemaPage />
              </Suspense>
            }
          />
        )}
      </Routes>
    </TooltipProvider>
  );
}
