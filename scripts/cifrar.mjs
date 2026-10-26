// Arma un paquete por usuario con lo que esa persona puede ver y lo cifra con su contraseña.
// La página publicada lleva solo estos paquetes: sin la contraseña no se lee nada, aunque el
// repo y el sitio sean públicos.
//
//   node scripts/cifrar.mjs            usa datos/usuarios.json (lo crea con contraseñas nuevas si no existe)
//
// Para cambiar una contraseña o sumar a alguien: editá datos/usuarios.json y volvé a correrlo.
// rol: admin (ve todo), lider (lo suyo y lo de "equipo") o agente (lo suyo). "nombre" pisa el de Personas.
import { createCipheriv, createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ITERACIONES = 310_000;
const raiz = fileURLToPath(new URL("..", import.meta.url));
const tablero = JSON.parse(readFileSync(`${raiz}datos/tablero.json`, "utf8"));
const rutaUsuarios = `${raiz}datos/usuarios.json`;

function contrasenaNueva() {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  const s = [...bytes].map((b) => letras[b % letras.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

if (!existsSync(rutaUsuarios)) {
  const usuarios = [
    { usuario: "gonzalo", rol: "admin", persona: "gonza" },
    ...tablero.people
      .filter((p) => p.id !== "gonza")
      .map((p) => ({ usuario: p.id, rol: "agente", persona: p.id })),
  ].map((u) => ({ ...u, contrasena: contrasenaNueva() }));
  writeFileSync(rutaUsuarios, JSON.stringify(usuarios, null, 2));
}
const usuarios = JSON.parse(readFileSync(rutaUsuarios, "utf8"));

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

const paquetes = usuarios.map((u) => {
  const persona = tablero.people.find((p) => p.id === u.persona);
  const contenido = {
    user: { name: u.nombre ?? persona?.name ?? u.usuario, role: u.rol, person: u.persona, team: u.equipo ?? [] },
    data: u.rol === "admin" ? tablero : vistaDe([u.persona, ...(u.equipo ?? [])]),
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
