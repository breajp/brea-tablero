// Publica el tablero a los 15 minutos de cada cambio de la planilla, sin depender del cron de GitHub
// (que corre cuando puede y se apaga solo a los 60 días sin commits).
//
// Va en un proyecto de Apps Script APARTE, no en el de la planilla: el código de un disparador corre con
// los permisos de quien lo instaló, y el de la planilla lo puede ver y cambiar cualquier editor.
//
// Instalación, una sola vez, con la cuenta de Google de Brea (la que es editora de la planilla):
// 1. En GitHub, con la cuenta breajp: Settings → Developer settings → Fine-grained tokens → Generate.
//    Repositorio: solo breajp/brea-tablero. Permiso: Actions → Read and write. Vencimiento: el más largo
//    posible, y agendar la fecha para renovarlo.
// 2. script.google.com → Nuevo proyecto → pegar este archivo. En Configuración del proyecto, tildar
//    "Mostrar el archivo de manifiesto" y pegar el appsscript.json de abajo.
// 3. Configuración del proyecto → Propiedades del script → GITHUB_TOKEN = el token del paso 1.
// 4. Elegir la función instalarDisparador → Ejecutar → aceptar los permisos.
// 5. Probar: cambiar una celda de la planilla y ver en GitHub → Actions, antes de 15 minutos, una corrida
//    "workflow_dispatch". Si el token vence, el error le llega por mail a la cuenta que lo instaló.
//
// appsscript.json de este proyecto:
// {
//   "timeZone": "America/Argentina/Buenos_Aires",
//   "runtimeVersion": "V8",
//   "oauthScopes": [
//     "https://www.googleapis.com/auth/drive.readonly",
//     "https://www.googleapis.com/auth/script.external_request",
//     "https://www.googleapis.com/auth/script.scriptapp"
//   ]
// }

const PLANILLA_ID = "1CZTxDB39Ptg61TUvUYb6lI4S0buCqjUzD7-GjPpEbnQ";
const REPO = "breajp/brea-tablero";
const WORKFLOW = "pages.yml";

function publicarSiCambio() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("Falta GITHUB_TOKEN en las Propiedades del script");
  const cambio = DriveApp.getFileById(PLANILLA_ID).getLastUpdated().getTime();
  if (cambio <= Number(props.getProperty("ULTIMO_CAMBIO_PUBLICADO") || 0)) return;
  const r = UrlFetchApp.fetch("https://api.github.com/repos/" + REPO + "/actions/workflows/" + WORKFLOW + "/dispatches", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    payload: JSON.stringify({ ref: "main" }),
    muteHttpExceptions: true,
  });
  if (r.getResponseCode() !== 204) throw new Error("GitHub respondió " + r.getResponseCode() + ": " + r.getContentText());
  props.setProperty("ULTIMO_CAMBIO_PUBLICADO", String(cambio));
}

function instalarDisparador() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "publicarSiCambio")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("publicarSiCambio").timeBased().everyMinutes(15).create();
  publicarSiCambio();
}
