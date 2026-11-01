"""La huella de lo que publica el tablero: los datos extraídos y los usuarios, sin la hora de lectura.
El export de Google reordena estilos y textos en cada descarga, así que el .xlsx no sirve para comparar.
El vigilante compara esta huella con la publicada (version.txt) para saber si hay algo nuevo."""
import hashlib
import json
import sys

tablero, accesos = (json.load(open(r)) for r in sys.argv[1:3])
for volatil in ("generatedAt", "updatedAt"):
    tablero.pop(volatil, None)
texto = json.dumps([tablero, accesos], sort_keys=True, ensure_ascii=False)
print(hashlib.sha256(texto.encode()).hexdigest())
