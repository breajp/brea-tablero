# Brea Tablero

El tablero de Brea Propiedades: producción de cada agente, comisiones, reparto entre productor, agente, líder, gerencia y Brea, y el movimiento de la cartera. Se arma desde la planilla de operaciones de 2026.

Es un sitio estático. No tiene servidor ni base de datos: se publica en GitHub Pages y cada persona entra con un usuario y una contraseña hechos a mano.

## Cómo funciona el acceso

1. `datos/extraer.py` lee la planilla ordenada: la hoja 2026, Personas (quién es quién, % y rol), Categorías, Costos, Precios y las notas de Para revisar. Un nombre nuevo o cambiado en Personas llega solo; lo único que se toca a mano son los usuarios.
   Antes leía (`datos/planilla.xlsx`, hoja **2026**) y deja `datos/tablero.json`. Busca cada columna por su encabezado, así que reordenar columnas no lo rompe; renombrar un encabezado sí, y avisa cuál falta.
2. `scripts/cifrar.mjs` arma un paquete por usuario con lo que esa persona puede ver y lo cifra con su contraseña (AES-256-GCM, clave derivada con PBKDF2). El admin ve todo. Cada agente ve solo sus operaciones y su parte, sin los montos de los demás ni los de Brea.
3. La página publicada lleva solo `apps/web/src/datos/paquetes.json`, que está cifrado. Sin la contraseña no se puede leer, aunque el repo sea público.

`datos/` (la planilla procesada y `usuarios.json` con las contraseñas) **nunca se sube al repo**: lo excluye `.gitignore`. Guardá `datos/usuarios.json` en un lugar seguro.

## Actualizar los datos

```bash
# En la planilla ordenada: Archivo → Descargar → Microsoft Excel, guardado como datos/planilla.xlsx
pip install openpyxl
npm run datos        # extrae (planilla + comisiones) y vuelve a cifrar
git add apps/web/src/datos/paquetes.json && git commit -m "Datos al <fecha>" && git push
```

El push publica solo: `.github/workflows/pages.yml` corre los tests, arma el sitio y lo sube a Pages.

## Usuarios y contraseñas

Están en `datos/usuarios.json`:

```json
{ "usuario": "flor", "rol": "agente", "persona": "flor", "contrasena": "…" }
```

- **Sumar a alguien:** agregalo con `rol` `admin` (ve todo), `lider` (lo suyo y lo de las personas de `equipo`) o `agente` (lo suyo). `persona` es el nombre de la pestaña Personas en minúsculas y con guiones (`gonza-caba`, `tomas`). `nombre` es opcional y pisa el que se muestra.
- **Cambiar una contraseña:** editala y corré `node scripts/cifrar.mjs`.
- **Sacar a alguien:** borralo y volvé a cifrar. Su contraseña deja de abrir el tablero en cuanto se publica.

Con ese archivo borrado, `cifrar.mjs` genera contraseñas nuevas para todos.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5190
npm run test         # incluye los totales de la planilla, si datos/tablero.json existe
npm run un-archivo   # el sitio en un solo HTML (para mostrarlo como artifact)
```

## Reglas de negocio

Confirmadas con Gonzalo el 22/10/2026:

- Bruto general = precio de cierre × (honorario vendedor + honorario comprador).
- Bruto productor = bruto × (1 − acuerdo interno); el resto es del agente.
- $ productor = bruto productor × su % (pestaña COMISIONES). El % sale de la categoría del agente, según la planilla de comisiones (`datos/comisiones.xlsx`):

  | Categoría | Agente | Líder | Brea | Meta anual (bruto) |
  |---|---|---|---|---|
  | Junior | 45 % | 20 % | 35 % | US$ 30.000 |
  | Activo | 50 % | 15 % | 35 % | US$ 65.000 |
  | Senior | 60 % | 5 % | 35 % | US$ 100.000 |
  | Experto (líder de equipo) | 65 % | 0 % | 35 % | — |

  Quien llega a la meta del año (y cumple el tiempo en la categoría) pasa a la siguiente. Flor tiene un acuerdo aparte: 70 % en sus producciones y 30 % para la oficina. La tabla vive en la pestaña Categorías de la planilla ordenada.
- Líder = 65 % menos el % del productor, sobre el bruto productor: la oficina se queda siempre el 35 % (confirmado el 23/10). Gerencia = 45 % de (oficina − líder), salvo cuando la producción es de Cecilia, que es la gerente.
- Brea = oficina − líder − gerencia.
- **La producción de un agente es el bruto** que generó como productor, agente y líder. El neto se muestra aparte.
- Lo cerrado cuenta en el **mes de cobro** (Mes impacto): hasta que no se firma no se imputa nada.
- **Todo en dólares.** Un alquiler en pesos se pasa al cambio del día de firma del contrato.
- **Tres Arroyos (Gonza 3A) es una unidad aparte**, de Gonza y sin gerencia: no entra en los números de la inmobiliaria.
- **Ya no hay bolsas**: una operación compartida se cobra como colega. Las dos bolsas de 2026 quedan como historia.

Roles: Cecilia es gerente y Juana lleva la administración (carga la planilla); las dos además trabajan como agentes. En el tablero, Gonzalo y Cecilia son admin.

El tablero muestra los montos como están en la planilla: no recalcula las fórmulas. La pantalla **Revisar** lista dónde la planilla se aparta de estas reglas.

## Diseño

El sistema visual sale de `abn-digital/product-design-system`: tokens en `apps/web/src/index.css`, piezas en `components/ui` y `components/layout`, y la guía en `.claude/skills/sistema/`. Las pantallas nuevas se arman con esas piezas.
