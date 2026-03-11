# ============================================
# RUTAS HISTORIAL — Log de subidas desde MongoDB
# Lee las colecciones "menus" y "eventos" de MongoDB
# Muestra quién subió, cuándo, qué archivo
# Ya NO usa las tablas SQL de Menu/Evento
# ============================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from mongodb import coleccion_menus, coleccion_eventos
from auth_token import verificar_token
from database import get_db, Personal

router = APIRouter()


# === HISTORIAL COMPLETO (menú + evento desde MongoDB) ===
@router.get("/historial")
async def listar_historial(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    resultado = []

    # --- Registros de Menú desde MongoDB ---
    cursor_menus = coleccion_menus.find().sort("fecha_subida", -1)
    async for m in cursor_menus:
        # Obtener nombre: del documento MongoDB, o buscar en SQL si no existe
        nombre = m.get("nombre_usuario", None)
        if not nombre and m.get("id_accs"):
            personal = db.query(Personal).filter(Personal.ID_ACCS == m["id_accs"]).first()
            nombre = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else None
        resultado.append({
            "tipo": "menu",
            "archivo": m.get("archivo", ""),
            "url": "/assets/menus/" + m.get("archivo", ""),
            "fecha_subida": str(m.get("fecha_subida", "")),
            "id_accs": m.get("id_accs", None),
            "nombre_usuario": nombre,
        })

    # --- Registros de Evento desde MongoDB ---
    cursor_eventos = coleccion_eventos.find().sort("fecha_subida", -1)
    async for e in cursor_eventos:
        # Obtener nombre: del documento MongoDB, o buscar en SQL si no existe
        nombre = e.get("nombre_usuario", None)
        if not nombre and e.get("id_accs"):
            personal = db.query(Personal).filter(Personal.ID_ACCS == e["id_accs"]).first()
            nombre = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else None
        resultado.append({
            "tipo": "evento",
            "archivo": e.get("archivo", ""),
            "url": "/assets/eventos/" + e.get("archivo", ""),
            "fecha_subida": str(e.get("fecha_subida", "")),
            "id_accs": e.get("id_accs", None),
            "nombre_usuario": nombre,
        })

    # Ordenar todo por fecha (más reciente primero)
    resultado.sort(key=lambda x: x["fecha_subida"] or "", reverse=True)

    return resultado


# === HISTORIAL SOLO MENÚS (desde MongoDB) ===
@router.get("/historial/menus")
async def historial_menus(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    resultado = []

    cursor = coleccion_menus.find().sort("fecha_subida", -1)
    async for m in cursor:
        nombre = m.get("nombre_usuario", None)
        if not nombre and m.get("id_accs"):
            personal = db.query(Personal).filter(Personal.ID_ACCS == m["id_accs"]).first()
            nombre = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else None
        resultado.append({
            "tipo": "menu",
            "archivo": m.get("archivo", ""),
            "url": "/assets/menus/" + m.get("archivo", ""),
            "fecha_subida": str(m.get("fecha_subida", "")),
            "id_accs": m.get("id_accs", None),
            "nombre_usuario": nombre,
        })

    return resultado


# === HISTORIAL SOLO EVENTOS (desde MongoDB) ===
@router.get("/historial/eventos")
async def historial_eventos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    resultado = []

    cursor = coleccion_eventos.find().sort("fecha_subida", -1)
    async for e in cursor:
        nombre = e.get("nombre_usuario", None)
        if not nombre and e.get("id_accs"):
            personal = db.query(Personal).filter(Personal.ID_ACCS == e["id_accs"]).first()
            nombre = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else None
        resultado.append({
            "tipo": "evento",
            "archivo": e.get("archivo", ""),
            "url": "/assets/eventos/" + e.get("archivo", ""),
            "fecha_subida": str(e.get("fecha_subida", "")),
            "id_accs": e.get("id_accs", None),
            "nombre_usuario": nombre,
        })

    return resultado
