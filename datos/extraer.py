"""Lee la planilla de Brea y deja datos/tablero.json: operaciones, participaciones y lo que hay que revisar.

La hoja maestra es "2026". Las hojas por agente son copias hechas a mano: no se leen como fuente,
solo se comparan contra la maestra para mostrar dónde no coinciden.
"""
import json
import re
import sys
from datetime import date, datetime

import openpyxl
from openpyxl.utils import column_index_from_string as col

HOY = date(2026, 10, 21)
ESTADOS = {
    "A": ("activa", "Activa"),
    "B": ("reservada", "Reservada"),
    "C": ("firma", "Firma pautada"),
    "D": ("vendida", "Vendida"),
    "E": ("alquilada", "Alquilada"),
    "F": ("comprada", "Comprada"),
    "G": ("pausada", "Pausada"),
    "H": ("baja", "Baja"),
}
PERSONAS = {
    "gonza 3a": "gonza", "gonza caba": "gonza", "gonza": "gonza",
    "flor": "flor", "cecilia": "cecilia", "nati": "nati", "juana": "juana",
    "mariana": "mariana", "tomas": "tomas", "emily": "emily", "agustina": "agustina",
}
NOMBRES = {
    "gonza": "Gonza", "flor": "Flor", "cecilia": "Cecilia", "nati": "Nati", "juana": "Juana",
    "mariana": "Mariana", "tomas": "Tomás", "emily": "Emily", "agustina": "Agustina",
}
DINERO = ["AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ"]
HOJAS_COPIA = ["OFICINA", "Gonza", "Flor", "Ceci", "Marian", "Nati", "Juana", "Emily", "Tomas"]


def persona(v):
    if not v:
        return None
    return PERSONAS.get(str(v).strip().lower())


def num(v):
    return round(float(v), 2) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def pct(v):
    # Los honorarios son fracciones chicas (0,015, 0,0415): redondear a centavos los rompe.
    return round(float(v), 6) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def dia(v):
    return v.date().isoformat() if isinstance(v, datetime) else None


def mes(v):
    # "Mes Impacto" se carga como 3/3, 4/4, 5/5: el día repite el mes para que la celda muestre "3- marzo".
    return f"{v.year}-{v.month:02d}" if isinstance(v, datetime) else None


def main(ruta, salida):
    wb = openpyxl.load_workbook(ruta, data_only=True)
    wf = openpyxl.load_workbook(ruta)
    ws, fs = wb["2026"], wf["2026"]
    c = lambda r, k: ws.cell(r, col(k)).value

    tasas = {persona(f.value): f.offset(0, 1).value for f in wb["COMISIONES"]["A"] if persona(f.value)}

    operaciones, participaciones, revisar = [], [], []
    grupos = {}
    for r in range(3, ws.max_row + 1):
        prop = c(r, "B")
        estado = str(c(r, "A") or "")[:1]
        if not prop or estado not in ESTADOS:
            continue
        estado_id, _ = ESTADOS[estado]
        listado, reserva = dia(c(r, "P")), dia(c(r, "Q"))
        publi, cierre = num(c(r, "V")), num(c(r, "W"))
        nego = num(c(r, "X"))
        cobro = mes(c(r, "U")) or mes(c(r, "R")) or mes(c(r, "Q"))
        nota = str(c(r, "O")).strip() if c(r, "O") else None

        dias = None
        if listado:
            hasta = date.fromisoformat(reserva) if reserva else HOY
            dias = (hasta - date.fromisoformat(listado)).days

        # Una operación en bolsa se carga en dos filas, una por inmobiliaria o agente: misma
        # propiedad, mismo precio y misma fecha. Para contar operaciones y volumen va una sola vez.
        clave = (re.sub(r"\W", "", prop.lower()), cierre, reserva) if cierre else ("fila", r)
        trato = grupos.setdefault(clave, f"op-{len(grupos) + 1}")

        op = {
            "row": r, "deal": trato, "property": prop.strip(), "status": estado_id,
            "producer": persona(c(r, "C")), "producerLabel": c(r, "C"),
            "agent": persona(c(r, "D")), "leader": persona(c(r, "E")),
            "kind": c(r, "F"), "typology": c(r, "G"),
            "sellerFee": pct(c(r, "L")), "buyerFee": pct(c(r, "M")), "internalSplit": pct(c(r, "N")),
            "notes": nota, "listedAt": listado, "reservedAt": reserva, "signedAt": dia(c(r, "AP")),
            "billingMonth": cobro, "listPrice": publi, "closePrice": cierre, "deedPrice": num(c(r, "Y")),
            "negotiationPct": nego, "daysListed": dias,
            "gross": num(c(r, "AB")), "producerGross": num(c(r, "AC")), "agentGross": num(c(r, "AD")),
            "producerNet": num(c(r, "AE")), "agentNet": num(c(r, "AF")), "office": num(c(r, "AG")),
            "leaderNet": num(c(r, "AH")), "management": num(c(r, "AI")), "brea": num(c(r, "AJ")),
            "potential": round(publi * c(r, "L"), 2) if publi and isinstance(c(r, "L"), (int, float)) and c(r, "L") > 0 else None,
        }
        operaciones.append(op)

        if estado in "BCDEF":
            for rol, quien, bruto, neto in (
                ("productor", op["producer"], op["producerGross"], op["producerNet"]),
                ("agente", op["agent"], op["agentGross"], op["agentNet"]),
                ("lider", op["leader"], op["leaderNet"], op["leaderNet"]),
            ):
                if quien and (bruto or neto):
                    participaciones.append({
                        "row": r, "deal": trato, "person": quien, "role": rol,
                        "gross": bruto or 0, "net": neto or 0,
                        "stage": "cerrada" if estado in "DEF" else "en-curso", "month": cobro,
                    })

        if not listado:
            revisar.append({"kind": "fecha", "row": r, "property": prop,
                            "detail": "Sin fecha de ingreso: la columna de días publicada da 46.292."})
        if nego is not None and abs(nego) > 50:
            revisar.append({"kind": "moneda", "row": r, "property": prop,
                            "detail": f"Publicada a {publi:,.0f} y cerrada a {cierre:,.0f}: parece mezclar pesos y dólares. La negociación da {nego:.1f} %."})

    # Fórmulas pisadas a mano en la maestra: la que usa la mayoría de la columna es la regla, el resto se desvía.
    for k in ["Z", "AA"] + DINERO:
        patrones = {}
        for r in range(3, fs.max_row + 1):
            v = fs.cell(r, col(k)).value
            if v is None or not fs.cell(r, 2).value:
                continue
            patrones.setdefault(re.sub(rf"(?<=[A-Z]){r}\b", "#", str(v)).strip(), []).append(r)
        if len(patrones) > 1:
            regla = max(patrones, key=lambda p: len(patrones[p]))
            for p, filas in patrones.items():
                if p == regla:
                    continue
                for r in filas:
                    revisar.append({"kind": "formula", "row": r, "property": fs.cell(r, 2).value, "column": k,
                                    "detail": f"La columna {ws.cell(2, col(k)).value} usa {p.replace('#', str(r))} en vez de la fórmula del resto."})

    # Las copias por agente contra la maestra: misma operación, montos distintos.
    for hoja in HOJAS_COPIA:
        h = wb[hoja]
        for r in range(3, h.max_row + 1):
            cierre = num(h.cell(r, col("W")).value)
            if not cierre or not h.cell(r, 2).value:
                continue
            candidatas = [o for o in operaciones if o["closePrice"] == cierre]
            if not candidatas:
                continue
            campos = {"AB": "gross", "AE": "producerNet", "AF": "agentNet", "AH": "leaderNet", "AI": "management", "AJ": "brea"}
            def diferencias(o):
                return [(k, num(h.cell(r, col(k)).value) or 0, o[f] or 0) for k, f in campos.items()
                        if abs((num(h.cell(r, col(k)).value) or 0) - (o[f] or 0)) > 1]
            o = min(candidatas, key=lambda o: len(diferencias(o)))
            for k, copia, maestra in diferencias(o):
                revisar.append({"kind": "copia", "row": o["row"], "property": o["property"], "sheet": hoja,
                                "detail": f"{ws.cell(2, col(k)).value}: {copia:,.0f} en la hoja {hoja} y {maestra:,.0f} en la maestra."})

    personas = [{"id": p, "name": NOMBRES[p], "rate": tasas.get(p)} for p in NOMBRES]
    json.dump({
        "generatedAt": HOY.isoformat(),
        "source": "2026 Operaciones Brea Propiedades · hoja 2026",
        "people": personas, "deals": operaciones, "shares": participaciones, "issues": revisar,
    }, open(salida, "w"), ensure_ascii=False, indent=1)
    print(f"{len(operaciones)} filas, {len(grupos)} operaciones, {len(participaciones)} participaciones, {len(revisar)} para revisar")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
