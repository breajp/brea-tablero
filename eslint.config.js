import js from "@eslint/js";
import tailwind from "eslint-plugin-better-tailwindcss";
import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults";
import { MatcherType, SelectorKind } from "eslint-plugin-better-tailwindcss/types";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// El lint vigila lo que el sistema no puede dejar librado a la memoria: que
// cada clase exista en el sistema, que los colores salgan de los tokens y que
// nadie esquive las primitivas. Cada regla dice qué hacer en su mensaje.

const CLASES_DEL_SISTEMA = {
  restrict: [
    {
      pattern: "^(.*:)?(bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|caret|accent|shadow)-\\[(#|rgb|hsl|oklch|color).*$",
      message: "Los colores salen de los tokens de src/index.css. Si falta uno, se agrega ahí con su porqué.",
    },
    {
      pattern: "^(.*:)?outline-none$",
      message: "outline-hidden: outline-none también borra el contorno en alto contraste. Y el foco se ve siempre.",
      fix: "$1outline-hidden",
    },
  ],
};

export default tseslint.config(
  { ignores: ["**/dist/**", "**/dist-ssr/**", "**/node_modules/**", "**/generated/**", "**/banco/**", "**/*.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // `console` solo al arrancar: adentro de una request va req.log, que ya
      // trae el requestId, el usuario y el cliente.
      "no-console": "error",
      // Un catch vacío es cómo se dice "sin localStorage (modo privado,
      // bloqueado) se sigue sin recordar". Cualquier otro bloque vacío, no.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "better-tailwindcss": tailwind },
    settings: {
      "better-tailwindcss": {
        entryPoint: "apps/web/src/index.css",
        selectors: [
          ...getDefaultSelectors(),
          // Las constantes de clases de las primitivas (BASE, LIGHT, TONES…).
          {
            kind: SelectorKind.Variable,
            name: "^(BASE|LIGHT|DARK|SIZES|TONES|TONES_DARK|SHELL|item)$",
            match: [{ type: MatcherType.String }, { type: MatcherType.ObjectValue }],
          },
        ],
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-restricted-classes": ["error", CLASES_DEL_SISTEMA],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "framer-motion", message: "Se usa motion/react." },
            { name: "react-router-dom", message: "Se usa react-router." },
          ],
          patterns: [{ group: ["@radix-ui/*"], message: "Radix entra por el paquete radix-ui, y solo en components/." }],
        },
      ],
    },
  },
  {
    // Radix y sonner se usan a través de las primitivas: una pantalla que los
    // importa directo arma su propio modal y rompe cómo abre y cierra todo.
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["apps/web/src/components/**", "apps/web/src/lib/avisos.ts", "apps/web/src/Base.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "radix-ui", message: "Se usa la primitiva de components/ui (Sheet, RowMenu, Tooltip…)." },
            { name: "sonner", message: "Los avisos salen de lib/avisos." },
            { name: "framer-motion", message: "Se usa motion/react." },
            { name: "react-router-dom", message: "Se usa react-router." },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/src/components/layout/ErrorBoundary.tsx"],
    rules: { "no-console": "off" },
  },
  {
    files: ["**/*.{js,mjs}", "apps/api/**/*.ts", "packages/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/scripts/**", "despliegue/**", "apps/api/src/server.ts", "apps/api/src/workers/**", "apps/api/prisma/**"],
    rules: { "no-console": "off" },
  },
);
