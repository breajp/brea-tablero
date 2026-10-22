import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { URL, fileURLToPath } from "node:url";
import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Rutas relativas: GitHub Pages lo sirve desde /<repo>/ y no desde la raíz.
  base: "./",
  plugins: [react(), tailwindcss()],
  // Las variables del proyecto viven en la raíz (.env.local junto a
  // .env.schema): Vite toma de ahí solo las VITE_*.
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    // El shared se consume desde src y no desde dist: sin esto hay que compilar
    // el paquete cada vez que cambia un schema para que el front lo vea. Con
    // una condición propia y no "development": esa la exportan también
    // react-router y otros, y el build de producción empaquetaría sus builds de
    // desarrollo.
    conditions: ["@brea-tablero/source", ...defaultClientConditions],
  },
  // strictPort: si el 5190 está ocupado, que falle en vez de correrse a otro
  // puerto en silencio y servir código viejo desde el proceso anterior.
  server: {
    port: 5190,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
  },
});
