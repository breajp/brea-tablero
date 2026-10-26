// Entrega la planilla en .xlsx a la actualización automática del tablero (GitHub Actions),
// solo si la pide con la clave. Se implementa como App web: Ejecutar como "Yo", acceso "Cualquier usuario".
// La clave va acá y en el secreto PLANILLA_URL de GitHub: si se cambia, hay que cambiar los dos.
const CLAVE = "PEGAR_LA_CLAVE";

function doGet(e) {
  if (!e || !e.parameter || e.parameter.clave !== CLAVE) {
    return ContentService.createTextOutput("Sin permiso");
  }
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  const respuesta = UrlFetchApp.fetch("https://docs.google.com/spreadsheets/d/" + id + "/export?format=xlsx", {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
  });
  return ContentService.createTextOutput(Utilities.base64Encode(respuesta.getContent()));
}

// Nunca se llama: está para que Apps Script pida el permiso de leer el archivo al autorizar.
function permisoDeLectura_() {
  DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
}
