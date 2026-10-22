// Junta el build en un solo HTML sin <html>/<head>/<body>, que es lo que pide un artifact de Claude.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [, , dist, salida] = process.argv;
const html = readFileSync(join(dist, "index.html"), "utf8");
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g)].map((m) => readFileSync(join(dist, m[1]), "utf8"));
const js = [...html.matchAll(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g)].map((m) => readFileSync(join(dist, m[1]), "utf8"));
const fuentes = html.match(/<link\s+href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] ?? "";

writeFileSync(
  salida,
  `<title>Brea Tablero</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fuentes}
<style>body{background:rgb(242 239 233)}${css.join("\n")}</style>
<div id="root"></div>
<script type="module">${js.join("\n").replaceAll("</script", "<\\/script")}</script>
`,
);
console.log(`${salida}: ${(readFileSync(salida).length / 1024).toFixed(0)} KB`);
