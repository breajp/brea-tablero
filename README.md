# Brea Tablero

El tablero de Brea Propiedades: producción de cada agente, comisiones, reparto entre productor, agente, líder, gerencia y Brea, y el movimiento de la cartera. Se arma desde la planilla de operaciones de 2026.

Es un sitio estático. No tiene servidor ni base de datos: se publica en GitHub Pages y cada persona entra con un usuario y una contraseña hechos a mano.

## Cómo funciona el acceso

1. `datos/extraer.py` lee la planilla (`datos/planilla.xlsx`, hoja **2026**) y deja `datos/tablero.json`. Busca cada columna por su encabezado, así que reordenar columnas no lo rompe; renombrar un encabezado sí, y avisa cuál falta.
2. `scripts/cifrar.mjs` arma un paquete por usuario con lo que esa persona puede ver y lo cifra con su contraseña (AES-256-GCM, clave derivada con PBKDF2). El admin ve todo. Cada agente ve solo sus operaciones y su parte, sin los montos de los demás ni los de Brea.
3. La página publicada lleva solo `apps/web/src/datos/paquetes.json`, que está cifrado. Sin la contraseña no se puede leer, aunque el repo sea público.

`datos/` (la planilla procesada y `usuarios.json` con las contraseñas) **nunca se sube al repo**: lo excluye `.gitignore`. Guardá `datos/usuarios.json` en un lugar seguro.

## Actualizar los datos

```bash
# En el Sheet: Archivo → Descargar → Microsoft Excel, guardado como datos/planilla.xlsx
pip install openpyxl
npm run datos        # extrae y vuelve a cifrar
git add apps/web/src/datos/paquetes.json && git commit -m "Datos al <fecha>" && git push
```

El push publica solo: `.github/workflows/pages.yml` corre los tests, arma el sitio y lo sube a Pages.

## Usuarios y contraseñas

Están en `datos/usuarios.json`:

```json
{ "usuario": "flor", "rol": "agente", "persona": "flor", "contrasena": "…" }
```

- **Sumar a alguien:** agregalo con `rol` `admin` o `agente`. `persona` es el id que usa `datos/extraer.py` en `PERSONAS`.
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

## Reglas de negocio (hoy)

Salen de las fórmulas de la planilla y conviene confirmarlas con Gonzalo antes de cambiarlas:

- Bruto general = precio de cierre × (honorario vendedor + honorario comprador).
- Bruto productor = bruto × (1 − acuerdo interno); el resto es del agente.
- $ productor = bruto productor × su % (pestaña COMISIONES). Gonza CABA tiene 0 %: esa parte queda en la oficina.
- Líder = 15 % del bruto productor. Gerencia = 45 % de (oficina − líder), salvo cuando participa Cecilia.
- Brea = oficina − líder − gerencia.
- Lo cerrado cuenta en el **mes de cobro** (columna Mes impacto). Una operación en bolsa ocupa dos filas: para contar operaciones y volumen va una sola vez.

El tablero muestra los montos como están en la planilla: no recalcula las fórmulas. La pantalla **Revisar** lista dónde la planilla se aparta de estas reglas.

## Diseño

El sistema visual sale de `abn-digital/product-design-system`: tokens en `apps/web/src/index.css`, piezas en `components/ui` y `components/layout`, y la guía en `.claude/skills/sistema/`. Las pantallas nuevas se arman con esas piezas.
