# ============================================================
# rutas_saludos_cumpleanos.py
# Módulo de Saludos de Cumpleaños — Marketing
#
# Endpoints:
#   GET  /saludos-cumpleanos/pendiente      — ¿tiene el usuario un saludo pendiente hoy?
#   POST /saludos-cumpleanos/enviar         — enviar un saludo
#   GET  /saludos-cumpleanos/activos        — cumpleaños activos (hoy) para Marketing
#   GET  /saludos-cumpleanos/{id}/recopilado — saludos recibidos por un cumpleañero
#   GET  /saludos-cumpleanos/{id}/faltantes  — quiénes aún no han enviado saludo
# ============================================================

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_, and_
from database import get_db, Personal, Contrato, Acceso
from mongodb import coleccion_saludos_cumple, coleccion_archivo_saludos
from auth_token import verificar_token

router = APIRouter(prefix="/saludos-cumpleanos", tags=["Saludos Cumpleaños"])


# ── Schema ──────────────────────────
class SaludoRequest(BaseModel):
    id_personal_cumple: int
    mensaje: str


# ── Helpers ─────────────────────────
def _cumpleaneros_proximos(db):
    """Retorna lista de Personal que cumplen años HOY o en los próximos 2 días.
    Cada elemento es una tupla (Personal, dias_para_cumple).
    TODAS las empresas, sin duplicados."""
    hoy = datetime.now().date()
    fechas = [hoy + timedelta(days=d) for d in range(3)]  # hoy, mañana, pasado

    # Construir filtros OR para cada fecha
    filtros_fecha = []
    for f in fechas:
        filtros_fecha.append(
            and_(
                extract("month", Personal.FECH_NAC) == f.month,
                extract("day", Personal.FECH_NAC) == f.day,
            )
        )

    rows = (
        db.query(Personal)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
            or_(*filtros_fecha),
        )
        .all()
    )
    # Deduplicar y calcular días restantes
    vistos = set()
    resultado = []
    for p in rows:
        if p.ID_PERSONAL in vistos:
            continue
        vistos.add(p.ID_PERSONAL)
        # Calcular cuántos días faltan para su cumpleaños
        cumple_este_anio = p.FECH_NAC.replace(year=hoy.year)
        if hasattr(cumple_este_anio, 'date'):
            cumple_este_anio = cumple_este_anio.date() if hasattr(cumple_este_anio, 'date') else cumple_este_anio
        dias_para = (cumple_este_anio - hoy).days
        resultado.append((p, dias_para))
    return resultado


def _todo_el_personal(db):
    """Retorna TODOS los empleados activos de TODAS las empresas (sin duplicados)."""
    rows = (
        db.query(Personal)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .all()
    )
    vistos = set()
    unicos = []
    for p in rows:
        if p.ID_PERSONAL not in vistos:
            vistos.add(p.ID_PERSONAL)
            unicos.append(p)
    return unicos


# ═════════════════════════════════════════════════════════════
# 1. PENDIENTE — ¿hay alguien cumpliendo años hoy sin que yo
#    le haya enviado saludo?
# ═════════════════════════════════════════════════════════════
@router.get("/pendiente")
async def saludo_pendiente(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    id_accs = token.get("id_accs")
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    if not personal:
        return {"pendiente": False}

    mi_id = personal.ID_PERSONAL
    hoy = datetime.now()
    anio = hoy.year
    cumpleaneros = _cumpleaneros_proximos(db)

    # Excluir al propio usuario (no se saluda a sí mismo)
    cumpleaneros = [(c, d) for c, d in cumpleaneros if c.ID_PERSONAL != mi_id]
    if not cumpleaneros:
        return {"pendiente": False}

    # Verificar cuáles ya saludé (priorizar los más cercanos primero)
    cumpleaneros.sort(key=lambda x: x[1])
    for c, dias_para in cumpleaneros:
        doc = await coleccion_saludos_cumple.find_one({
            "id_personal_cumple": c.ID_PERSONAL,
            "anio": anio,
        })
        ya_saludo = False
        if doc and doc.get("saludos"):
            ya_saludo = any(s["id_personal"] == mi_id for s in doc["saludos"])
        if not ya_saludo:
            return {
                "pendiente": True,
                "cumpleanero": {
                    "id_personal": c.ID_PERSONAL,
                    "nombre": f"{c.NOMBRES} {c.APE_PATERNO} {c.APE_MATERNO}",
                    "foto": c.FOTO,
                    "dias_para": dias_para,
                },
            }

    return {"pendiente": False}


# ═════════════════════════════════════════════════════════════
# 2. ENVIAR SALUDO
# ═════════════════════════════════════════════════════════════
@router.post("/enviar")
async def enviar_saludo(
    datos: SaludoRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    id_accs = token.get("id_accs")
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    mi_id = personal.ID_PERSONAL
    hoy = datetime.now()
    anio = hoy.year

    # Validar que el cumpleañero existe y cumple hoy o en los próximos 2 días
    cumpleanero = db.query(Personal).filter(Personal.ID_PERSONAL == datos.id_personal_cumple).first()
    if not cumpleanero:
        raise HTTPException(status_code=404, detail="Cumpleañero no encontrado")

    # Verificar que está en el rango de cumpleañeros próximos (hoy + 2 días)
    ids_validos = [c.ID_PERSONAL for c, _ in _cumpleaneros_proximos(db)]
    if cumpleanero.ID_PERSONAL not in ids_validos:
        raise HTTPException(status_code=400, detail="Esta persona no cumple años próximamente")

    if not datos.mensaje.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    # Upsert: crear doc si no existe, agregar saludo
    filtro = {
        "id_personal_cumple": datos.id_personal_cumple,
        "anio": anio,
    }
    doc = await coleccion_saludos_cumple.find_one(filtro)

    saludo_obj = {
        "id_personal": mi_id,
        "nombre": f"{personal.NOMBRES} {personal.APE_PATERNO} {personal.APE_MATERNO}",
        "mensaje": datos.mensaje.strip(),
        "fecha_envio": hoy,
    }

    if doc:
        # Verificar que no haya enviado ya
        ya = any(s["id_personal"] == mi_id for s in (doc.get("saludos") or []))
        if ya:
            raise HTTPException(status_code=400, detail="Ya enviaste un saludo a esta persona")
        await coleccion_saludos_cumple.update_one(filtro, {"$push": {"saludos": saludo_obj}})
    else:
        await coleccion_saludos_cumple.insert_one({
            **filtro,
            "nombre_cumple": f"{cumpleanero.NOMBRES} {cumpleanero.APE_PATERNO} {cumpleanero.APE_MATERNO}",
            "foto_cumple": cumpleanero.FOTO,
            "fecha_cumple": hoy.strftime("%Y-%m-%d"),
            "saludos": [saludo_obj],
        })

    return {"ok": True, "mensaje": "Saludo enviado correctamente"}


# ═════════════════════════════════════════════════════════════
# 3. ACTIVOS — cumpleaños activos hoy (vista Marketing)
# ═════════════════════════════════════════════════════════════
@router.get("/activos")
async def cumpleanos_activos(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    hoy = datetime.now()
    anio = hoy.year

    cumpleaneros = _cumpleaneros_proximos(db)
    total_personal = len(_todo_el_personal(db))

    resultado = []
    for c, dias_para in cumpleaneros:
        doc = await coleccion_saludos_cumple.find_one({
            "id_personal_cumple": c.ID_PERSONAL,
            "anio": anio,
        })
        total_saludos = len(doc["saludos"]) if doc and doc.get("saludos") else 0
        if dias_para == 0:
            etiqueta = "¡HOY!"
        elif dias_para == 1:
            etiqueta = "Mañana"
        else:
            etiqueta = f"En {dias_para} días"
        resultado.append({
            "id_personal": c.ID_PERSONAL,
            "nombre": f"{c.NOMBRES} {c.APE_PATERNO} {c.APE_MATERNO}",
            "foto": c.FOTO,
            "total_saludos": total_saludos,
            "total_personal": total_personal - 1,
            "dias_para": dias_para,
            "etiqueta": etiqueta,
        })

    # Ordenar: hoy primero, luego mañana, luego pasado
    resultado.sort(key=lambda x: x["dias_para"])
    return resultado


# ═════════════════════════════════════════════════════════════
# 4. RECOPILADO — todos los saludos recibidos por un cumpleañero
# ═════════════════════════════════════════════════════════════
@router.get("/{id_personal}/recopilado")
async def recopilado_saludos(
    id_personal: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    anio = datetime.now().year

    doc = await coleccion_saludos_cumple.find_one({
        "id_personal_cumple": id_personal,
        "anio": anio,
    })

    if not doc:
        return {"saludos": [], "nombre_cumple": ""}

    cumpleanero = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    nombre = f"{cumpleanero.NOMBRES} {cumpleanero.APE_PATERNO} {cumpleanero.APE_MATERNO}" if cumpleanero else ""

    return {
        "nombre_cumple": nombre,
        "foto_cumple": doc.get("foto_cumple"),
        "saludos": [
            {
                "id_personal": s["id_personal"],
                "nombre": s["nombre"],
                "mensaje": s["mensaje"],
                "fecha_envio": str(s.get("fecha_envio", "")),
            }
            for s in (doc.get("saludos") or [])
        ],
    }


# ═════════════════════════════════════════════════════════════
# 5. FALTANTES — quiénes NO han enviado saludo aún
# ═════════════════════════════════════════════════════════════
@router.get("/{id_personal}/faltantes")
async def faltantes_saludos(
    id_personal: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    anio = datetime.now().year

    # Todos los empleados activos (TODAS las empresas)
    todos = _todo_el_personal(db)

    # Saludos ya enviados
    doc = await coleccion_saludos_cumple.find_one({
        "id_personal_cumple": id_personal,
        "anio": anio,
    })
    ids_enviaron = set()
    if doc and doc.get("saludos"):
        ids_enviaron = {s["id_personal"] for s in doc["saludos"]}

    faltantes = []
    for p in todos:
        # Excluir al propio cumpleañero
        if p.ID_PERSONAL == id_personal:
            continue
        if p.ID_PERSONAL not in ids_enviaron:
            faltantes.append({
                "id_personal": p.ID_PERSONAL,
                "nombre": f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
                "foto": p.FOTO,
            })

    return {"faltantes": faltantes, "total": len(faltantes)}


# ═════════════════════════════════════════════════════════════
# 6. LIMPIEZA AUTOMÁTICA — Archivar y borrar saludos vencidos
#    (1 día después de la fecha de cumpleaños)
# ═════════════════════════════════════════════════════════════
import asyncio


async def archivar_y_limpiar_saludos():
    """
    Busca saludos de cumpleaños cuya fecha_cumple ya pasó hace más de 1 día.
    Los copia a la colección 'saludos_cumpleanos_archivo' en la BD 'erp_sql'
    y luego los elimina de la colección activa.
    """
    hoy = datetime.now().date()
    # Buscar documentos donde la fecha del cumpleaños ya venció (+1 día)
    cursor = coleccion_saludos_cumple.find({})
    archivados = 0
    eliminados = 0

    async for doc in cursor:
        try:
            fecha_cumple_str = doc.get("fecha_cumple")
            if not fecha_cumple_str:
                continue
            fecha_cumple = datetime.strptime(fecha_cumple_str, "%Y-%m-%d").date()
            # Si ya pasó más de 1 día desde el cumpleaños → archivar y eliminar
            if (hoy - fecha_cumple).days > 1:
                # Copiar a archivo (sin _id para evitar conflicto)
                doc_archivo = {k: v for k, v in doc.items() if k != "_id"}
                doc_archivo["fecha_archivado"] = datetime.now()
                await coleccion_archivo_saludos.insert_one(doc_archivo)
                archivados += 1

                # Eliminar de la colección activa
                await coleccion_saludos_cumple.delete_one({"_id": doc["_id"]})
                eliminados += 1
        except Exception as e:
            print(f"Error archivando saludo: {e}")
            continue

    if archivados > 0:
        print(f"[Limpieza Saludos] Archivados: {archivados}, Eliminados: {eliminados}")
    return {"archivados": archivados, "eliminados": eliminados}


async def tarea_limpieza_periodica():
    """Tarea en background que corre cada 24 horas para limpiar saludos vencidos."""
    while True:
        try:
            await archivar_y_limpiar_saludos()
        except Exception as e:
            print(f"[Limpieza Saludos] Error en tarea periódica: {e}")
        # Esperar 24 horas
        await asyncio.sleep(86400)


@router.get("/limpiar")
async def limpiar_saludos_manual(token: dict = Depends(verificar_token)):
    """Endpoint manual para forzar la limpieza de saludos vencidos (solo admin)."""
    resultado = await archivar_y_limpiar_saludos()
    return {"mensaje": "Limpieza ejecutada", **resultado}
