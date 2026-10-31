# Brea Tablero

El tablero de Brea Propiedades: producción de cada agente, comisiones, reparto entre productor, agente, líder, gerencia y Brea, y el movimiento de la cartera. Se arma desde la planilla de operaciones de 2026.

Es un sitio estático. No tiene servidor ni base de datos: se publica en GitHub Pages y cada persona entra con un usuario y una contraseña hechos a mano.

## Cómo funciona el acceso

1. `datos/extraer.py` lee la planilla ordenada: la hoja 2026, Personas (quién es quién, % y rol), Categorías, Costos, Precios y las notas de Para revisar. Un nombre nuevo o cambiado en Personas llega solo; lo único que se toca a mano son los usuarios.
   La planilla bajada va en `datos/planilla.xlsx` y el resultado queda en `datos/tablero.json`. En la hoja 2026 busca cada columna por su encabezado, así que reordenar columnas no lo rompe; renombrar un encabezado sí, y avisa cuál falta.
2. `scripts/cifrar.mjs` arma un paquete por usuario con lo que esa persona puede ver y lo cifra con su contraseña (AES-256-GCM, clave derivada con PBKDF2). El admin ve todo; una líder, lo suyo y lo de su equipo; cada agente, solo sus operaciones y su parte. Ni líderes ni agentes ven lo de Brea, la gerencia ni los costos.
3. La página publicada lleva solo `apps/web/src/datos/paquetes.json`, que está cifrado. Sin la contraseña no se puede leer, aunque el repo sea público.

`datos/` (la planilla procesada y `contrasenas.json` con las contraseñas) **nunca se sube al repo**: lo excluye `.gitignore`. Las contraseñas viven en el secreto `CONTRASENAS` del repo; `datos/contrasenas.json` es la copia local para actualizar a mano.

## Actualización automática

`.github/workflows/pages.yml` baja la planilla, la extrae, cifra un paquete por usuario y publica. Corre en cada push, a mano desde Actions y con un cron de 8 a 20 (hora argentina). GitHub larga el cron cuando puede: en octubre de 2026 corrió unas 3 veces por día, hasta 3 h tarde, y en un repo público lo apaga solo a los 60 días sin commits. Para que publique a los 15 minutos de cada cambio de la planilla, está `scripts/apps-script/Disparador.gs`: un proyecto de Apps Script aparte, con un token de GitHub, que dispara el workflow cuando la planilla cambia (los pasos están en el archivo).

- **La planilla** la entrega un Apps Script de la propia planilla (`scripts/apps-script/Tablero.gs`), implementado como App web y protegido con una clave. La URL con la clave está en el secreto `PLANILLA_URL`. Sin ese secreto, se publica lo que haya en `apps/web/src/datos/paquetes.json`.
- **Los usuarios** salen de la pestaña Usuarios de la planilla. La contraseña de cada uno es la "Contraseña nueva" de esa pestaña si está escrita; si no, la del secreto `CONTRASENAS` (un JSON `{"usuario": "contraseña"}`). Un usuario sin contraseña queda afuera y se avisa en la pantalla Revisar del admin. Si se borra una "Contraseña nueva", vuelve a valer la del secreto: para sacarla de la planilla, primero hay que sumarla a `CONTRASENAS`.
- Si algo falla, el sitio queda como estaba y GitHub avisa por mail a la cuenta dueña del repo.

## Usuarios y contraseñas

Se manejan en la pestaña **Usuarios** de la planilla: usuario, acceso (Ve todo, Líder, Agente), persona, equipo para las líderes y un nombre opcional. Las contraseñas no están en la planilla: solo se escribe una en "Contraseña nueva" para un usuario nuevo o para cambiar la de alguien, y tiene que quedar escrita hasta que alguien la pase al secreto `CONTRASENAS`.

## Actualizar a mano

```bash
# En la planilla ordenada: Archivo → Descargar → Microsoft Excel, guardado como datos/planilla.xlsx
python3 -m venv datos/.venv && datos/.venv/bin/pip install openpyxl
datos/.venv/bin/python datos/extraer.py datos/planilla.xlsx datos/tablero.json
node scripts/cifrar.mjs   # con las contraseñas en datos/contrasenas.json
```

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5190
npm run test         # sin cifras reales: el repo es público. Los totales se controlan contra la planilla en cada extracción
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

  Quien llega a la meta del año (y cumple el tiempo en la categoría) pasa a la siguiente. Los acuerdos individuales y la tabla viven en la pestaña Categorías de la planilla ordenada.
- Líder = 65 % menos el % del productor, sobre el bruto productor: la oficina se queda siempre el 35 % (confirmado el 23/10). Gerencia = 45 % de (oficina − líder), salvo cuando la producción es de Cecilia, que es la gerente.
- Brea = oficina − líder − gerencia.
- **La producción de un agente es el bruto** que generó como productor, agente y líder. El neto se muestra aparte.
- Lo cerrado cuenta en el **mes de cobro** (columna Mes de cobro de la hoja 2026: el Mes Impacto o, si falta, la fecha de conformación): hasta que no se firma no se imputa nada. El tablero lee esa misma columna.
- **Todo en dólares.** Un alquiler en pesos se pasa al cambio del día de firma del contrato.
- **Tres Arroyos (Gonza 3A) es una unidad aparte**, de Gonza y sin gerencia: no entra en los números de la inmobiliaria.
- **Ya no hay bolsas**: una operación compartida se cobra como colega. Las dos bolsas de 2026 quedan como historia.

Roles: Cecilia es gerente y Juana lleva la administración (carga la planilla); las dos además trabajan como agentes. En el tablero, Gonzalo y Cecilia son admin.

El tablero muestra los montos como están en la planilla: no recalcula las fórmulas. La pantalla **Revisar** lista dónde la planilla se aparta de estas reglas, lo que está mal cargado (encabezados, fechas, nombres que no están en Personas, usuarios, gastos sin dólar o repetidos) y cualquier diferencia entre el tablero y las pestañas Producción y Resumen mensual.

## Diseño

El sistema visual sale de `abn-digital/product-design-system`: tokens en `apps/web/src/index.css`, piezas en `components/ui` y `components/layout`, y la guía en `.claude/skills/sistema/`. Las pantallas nuevas se arman con esas piezas.
