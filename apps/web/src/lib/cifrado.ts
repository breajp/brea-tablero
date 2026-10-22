import paquetes from "@/datos/paquetes.json";
import type { Tablero, Usuario } from "@/dominio/tipos";

const desdeBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function claveDeUsuario(usuario: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`brea:${usuario.trim().toLowerCase()}`));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class AccesoIncorrecto extends Error {}

// Los datos de cada usuario viajan cifrados con su contraseña (scripts/cifrar.mjs). Usuario
// inexistente y contraseña equivocada dan el mismo error: no se dice cuál de los dos falló.
export async function abrir(usuario: string, contrasena: string): Promise<{ user: Usuario; data: Tablero }> {
  const clave = await claveDeUsuario(usuario);
  const paquete = paquetes.paquetes.find((p) => p.u === clave);
  if (!paquete) throw new AccesoIncorrecto();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(contrasena), "PBKDF2", false, ["deriveKey"]);
  const aes = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: desdeBase64(paquete.s), iterations: paquetes.iteraciones, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  try {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: desdeBase64(paquete.i) }, aes, desdeBase64(paquete.c));
    return JSON.parse(new TextDecoder().decode(plano));
  } catch {
    throw new AccesoIncorrecto();
  }
}
