import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import App from "./App";
import { Base } from "./Base";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import type { Tablero, Usuario } from "./dominio/tipos";
import { EntrarPage } from "./features/acceso/EntrarPage";
import { guardarSesion, leerSesionGuardada, SesionProvider } from "./sesion";

// MemoryRouter y no BrowserRouter: el sitio vive en una sola página estática (GitHub Pages o un
// artifact), donde una ruta real como /agentes no existe en el servidor y daría 404 al recargar.
function Raiz() {
  const [abierto, setAbierto] = useState<{ user: Usuario; data: Tablero } | null>(leerSesionGuardada);
  if (!abierto)
    return (
      <EntrarPage
        onEntrar={(a) => {
          guardarSesion(a);
          setAbierto(a);
        }}
      />
    );
  return (
    <SesionProvider abierto={abierto} onSalir={() => setAbierto(null)}>
      <MemoryRouter key={abierto.user.person}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </MemoryRouter>
    </SesionProvider>
  );
}

export function montar(raiz: HTMLElement) {
  createRoot(raiz).render(
    <Base>
      <Raiz />
    </Base>,
  );
}
