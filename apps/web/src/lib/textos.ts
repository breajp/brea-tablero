// Los textos de la plantilla que cambian con la voz del proyecto. Los neutros
// ("Cerrar", "Cancelar") van inline, como cualquier texto nuevo: esto no es un
// diccionario de la app, es lo que vino con el generador y habla de vos.
export const TEXTOS = {
  pantallaRota:
    "No es algo que hayas hecho mal. Volvé a cargar; si sigue pasando, contanos qué estabas haciendo.",
  notasPrimeraVezTitulo: "Escribí, y listo.",
  notasRecorridoBajada: "De la primera línea a encontrarla cuando la necesitás.",
  notaCuerpoPista: "¿Qué querés contar?",
  notaSinGuardar: "Cambios sin guardar. Guardá con ⌘ Enter.",
  notaSalirSinGuardar: "Si salís ahora, se pierde lo que cambiaste en el texto.",
  notasPrimeraVez:
    "Escribís, se guarda sola y la encontrás cuando la buscás. Es el ejemplo que trae la plantilla: reemplazalo por lo tuyo.",
  notasRecorrido: [
    { title: "Escribís una nota", what: "Un título y lo que quieras contar. Se guarda apenas la creás." },
    { title: "La encontrás cuando la buscás", what: "La búsqueda ignora tildes y mayúsculas, y recorre todas, no solo la página que ves." },
    { title: "La cambiás cuando quieras", what: "El título se edita en el lugar. Lo demás, adentro de la nota." },
  ],
  notaBorrarBajada: "Se borra para todo el equipo. No se puede deshacer.",
} as const;
