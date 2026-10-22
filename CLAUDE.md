# CLAUDE.md — Brea Tablero

## Qué es

Producción, comisiones y propiedades de Brea Propiedades.

Generado con `abn-digital/product-design-system`, que es la foto del sistema de diseño, UX y prácticas de `abn-digital/creativos`. La receta con la que se generó está en `.receta.json`: qué módulos tiene, en qué voz habla y cómo se despliega.

**Antes de crear o cambiar una pantalla, un componente, un texto, un endpoint o un job, usá la skill `sistema`** (`.claude/skills/sistema/`). Tiene las reglas, las piezas y los patrones, y cuándo va cada uno.

## Vocabulario

| Concepto | En el código | En la UI |
| -------- | ------------ | -------- |
| Una fila de la planilla | `Deal` | operación |
| La parte de una persona en una operación | `Share` | participación |
| Lo que la planilla tiene mal o le falta | `Issue` | para revisar |

Los sustantivos del dominio van en inglés en el código y en castellano en la interfaz. Los conceptos de interfaz y los componentes nuevos, en castellano (`Esqueleto`, `NombreEditable`, `useDiferido`).

## Decisiones (no volver atrás sin avisar)

- **El sistema visual es el de creativos y no se reinventa.** Colores, tipografía, forma, sombras y movimiento salen de `apps/web/src/index.css` y de `components/ui`. Las escalas están cerradas: una clase que no es del sistema no compila.
- **Ember es el único color de marca y marca actividad o elección.** Nunca decora.
- **La voz no se mezcla.** `npm run voz` falla si aparece la que no es la del proyecto.

## Stack

|           |                                                                   |
| --------- | ----------------------------------------------------------------- |
| Front     | React 19, Vite 8, Tailwind 4, Radix, motion, React Router 8       |
| Deploy    | GitHub Pages, sitio estático con los datos cifrados por usuario: ver `README.md` |

## Estructura

```
apps/web/src/
  index.css              los tokens del sistema: la fuente de verdad visual
  components/ui/         primitivas del sistema
  components/layout/     Shell, PageHeader, avisos, límite de errores
  lib/                   cn, avisos, errores, fechas, textos con voz
  hooks/                 hooks de conducta (useDiferido…) y de datos (useNotes…)
  features/<área>/       <Área>Page.tsx y lo que es solo de esa área
  producto.ts            nombre, descripción y dominio del producto
  navegacion.tsx         las secciones del riel
  pages/SistemaPage.tsx  la guía viva, solo en desarrollo (/sistema)
```

## Comentarios: el default es NO comentar

Un comentario es la excepción, no el acompañamiento de cada línea. Código lleno de comentarios no es código documentado: es código que no se explica solo, con parches encima. Y envejece: deja de coincidir con el código y pasa de inútil a mentiroso.

**Se comenta el porqué, nunca el qué.** Un comentario se gana su lugar solo si cabe en una de estas cuatro:

1. Una decisión no obvia y por qué se descartó la alternativa evidente.
2. Un workaround de un bug o una rareza de un tercero.
3. Una invariante que el tipo no puede expresar.
4. Una consecuencia peligrosa de tocar el código de al lado.

Todo lo demás se arregla con **nombres mejores, no con comentarios**. Si una función necesita tres líneas de explicación, el problema es la función.

Nada de JSDoc ceremonial: TypeScript ya declara tipos, parámetros y retorno. Nada de banners separando secciones, `// TODO` sin dueño, ni código viejo comentado "por las dudas": para eso está git.

```ts
// ❌ parafrasea la firma
/** Obtiene una nota por id */
export function getNote(id: string) { … }

// ❌ el comentario tapa un nombre malo
// Filtra las notas que ya se resumieron
const filtered = notes.filter((n) => n.status === "READY");

// ✅ el nombre lo dice
const readyNotes = notes.filter((n) => n.status === "READY");

// ✅ explica una decisión que el código no puede contar
// Vertex devuelve 429 cuando se agota la cuota. Sin traducirlo sale como 500 y
// la persona lee un error genérico en vez de entender que puede reintentar.
if (err.status === 429) throw new ProviderBusyError();
```

## Commits

Una oración en castellano que dice qué cambió para quien usa o mantiene el proyecto, no qué archivos se tocaron: "Una nota se resume sola y se puede volver a pedir". El cuerpo cuenta el porqué y cómo se verificó.

## Comandos

```bash
npm install
npm run dev:web        # el front en http://localhost:5190 (la guía viva en /sistema)
npm run verificar      # typecheck, lint, voz, tests y build: tiene que estar en verde
npm run format
```

## Pendientes y riesgos conocidos

- **La plantilla trae un ejemplo (las notas) que se reemplaza por el dominio del proyecto.** Cuando lo reemplaces, borrá lo que no uses: la pantalla y el hook, que guarda en el navegador.
- **El deploy necesita a infra:** el cambio para abn-cloud está preparado en `despliegue/`, pero lo aplica quien opera abn-cloud.
