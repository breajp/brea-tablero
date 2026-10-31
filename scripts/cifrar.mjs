// Arma un paquete por usuario con lo que esa persona puede ver y lo cifra con su contraseña.
// La página publicada lleva solo estos paquetes: sin la contraseña no se lee nada, aunque el
// repo y el sitio sean públicos.
//
// Quién entra sale de la pestaña Usuarios de la planilla (datos/accesos.json, lo deja extraer.py).
// La contraseña de cada uno es la "Contraseña nueva" de esa pestaña si está escrita; si no, la
// guardada en CONTRASENAS (secreto de GitHub) o en datos/contrasenas.json al correrlo a mano.
// Sin datos/accesos.json usa datos/usuarios.json, el formato anterior.
import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ITERACIONES = 310_000;
const raiz = fileURLToPath(new URL("..", import.meta.url));
const leer = (ruta) => JSON.parse(readFileSync(`${raiz}${ruta}`, "utf8"));
const tablero = leer("datos/tablero.json");
// Lo que conviene que el admin vea en Revisar sobre los accesos. Nunca lleva contraseñas.
const avisos = [];
const avisar = (usuario, detail) => avisos.push({ kind: "planilla", row: 0, property: `Usuarios · ${usuario}`, detail });

function usuarios() {
  if (!existsSync(`${raiz}datos/accesos.json`)) return leer("datos/usuarios.json");
  const guardadas = process.env.CONTRASENAS
    ? JSON.parse(process.env.CONTRASENAS)
    : existsSync(`${raiz}datos/contrasenas.json`)
      ? leer("datos/contrasenas.json")
      : {};
  return leer("datos/accesos.json").flatMap((a) => {
    const contrasena = a.contrasenaNueva ?? guardadas[a.usuario];
    // Sin contraseña no se inventa una: quedaría afuera sin saberlo. Se avisa y se sigue con el resto.
    if (!contrasena) {
      console.warn(`Sin contraseña, no entra: ${a.usuario}`);
      avisar(a.usuario, "No tiene contraseña: no puede entrar al tablero. Escribile una en «Contraseña nueva».");
      return [];
    }
    // Si se borra la celda vuelve a valer la del secreto CONTRASENAS (o ninguna, si es nuevo).
    if (a.contrasenaNueva && a.contrasenaNueva !== guardadas[a.usuario])
      avisar(a.usuario, "Entra con la «Contraseña nueva» de la planilla. No la borres hasta pasarla al secreto CONTRASENAS: si no, vuelve a valer la anterior.");
    if (contrasena.length < 12)
      avisar(a.usuario, "Su contraseña tiene menos de 12 caracteres. Los paquetes cifrados son públicos: conviene una más larga, por ejemplo cuatro palabras.");
    return [{ usuario: a.usuario, rol: a.rol, persona: a.persona, equipo: a.equipo, nombre: a.nombre ?? undefined, contrasena }];
  });
}

const PRIVADOS = ["gross", "producerGross", "agentGross", "producerNet", "agentNet", "office", "leaderNet", "management", "brea", "producerLabel"];

// Un agente ve lo suyo; una líder, lo suyo y lo de su equipo. Ninguno ve lo que se lleva Brea,
// la gerencia, los costos ni lo que hay para revisar.
function vistaDe(personas) {
  const suyas = tablero.deals.filter((d) => [d.producer, d.agent, d.leader].some((p) => personas.includes(p)));
  const propiedades = new Set(suyas.map((d) => d.property));
  return {
    ...tablero,
    people: tablero.people.filter((p) => personas.includes(p.id)),
    deals: suyas.map((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !PRIVADOS.includes(k)))),
    shares: tablero.shares.filter((s) => personas.includes(s.person)),
    priceChanges: (tablero.priceChanges ?? []).filter((c) => propiedades.has(c.property)),
    costs: [],
    issues: [],
  };
}

export const claveDeUsuario = (u) => createHash("sha256").update(`brea:${u.trim().toLowerCase()}`).digest("hex");

const lista = usuarios().filter((u, i, todos) => todos.findIndex((o) => o.usuario === u.usuario) === i);
if (!lista.length) {
  console.error("No hay ningún usuario con contraseña: no se publica, así nadie queda afuera.");
  process.exit(1);
}

const paquetes = lista.map((u) => {
  const persona = tablero.people.find((p) => p.id === u.persona);
  const contenido = {
    user: { name: u.nombre ?? persona?.name ?? u.usuario, role: u.rol, person: u.persona, team: u.equipo ?? [] },
    data: u.rol === "admin" ? { ...tablero, issues: [...tablero.issues, ...avisos] } : vistaDe([u.persona, ...(u.equipo ?? [])]),
  };
  const sal = randomBytes(16);
  const iv = randomBytes(12);
  const clave = pbkdf2Sync(u.contrasena, sal, ITERACIONES, 32, "sha256");
  const cifrador = createCipheriv("aes-256-gcm", clave, iv);
  const texto = Buffer.concat([cifrador.update(JSON.stringify(contenido), "utf8"), cifrador.final(), cifrador.getAuthTag()]);
  return { u: claveDeUsuario(u.usuario), s: sal.toString("base64"), i: iv.toString("base64"), c: texto.toString("base64") };
});

mkdirSync(`${raiz}apps/web/src/datos`, { recursive: true });
writeFileSync(`${raiz}apps/web/src/datos/paquetes.json`, JSON.stringify({ iteraciones: ITERACIONES, paquetes }));
console.log(`${paquetes.length} paquetes cifrados`);
