# ============================================
# RUTAS HISTORIAL — Log de subidas desde MongoDB
# Batch-loads Personal names (1 SQL query per endpoint)
# ============================================

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from mongodb import coleccion_menus, coleccion_eventos
from auth_token import verificar_token
from database import get_db, Personal

router = APIRouter()

LIMIT_DEFAULT = 200


async def _cargar_docs(coleccion, limite: int) -> list:
    """Lee documentos MongoDB con límite, ordenados por fecha desc."""
    cursor = coleccion.find().sort("fecha_subida", -1).limit(limite)
    return await cursor.to_list(length=limite)


def _resolver_nombres(db: Session, docs: list) -> dict:
    """Batch-load Personal por id_accs → {id_accs: 'Nombre Apellido'}."""
    ids_sin_nombre = {
        d["id_accs"] for d in docs
        if not d.get("nombre_usuario") and d.get("id_accs")
    }
    if not ids_sin_nombre:
        return {}
    personas = db.query(Personal).filter(Personal.ID_ACCS.in_(ids_sin_nombre)).all()
    return {p.ID_ACCS: f"{p.NOMBRES} {p.APE_PATERNO}" for p in personas}


def _serializar(doc, tipo: str, carpeta: str, nombres_map: dict) -> dict:
    nombre = doc.get("nombre_usuario") or nombres_map.get(doc.get("id_accs"))
    return {
        "tipo": tipo,
        "archivo": doc.get("archivo", ""),
        "url": f"/assets/{carpeta}/" + doc.get("archivo", ""),
        "fecha_subida": str(doc.get("fecha_subida", "")),
        "id_accs": doc.get("id_accs"),
        "nombre_usuario": nombre,
    }


# === HISTORIAL COMPLETO (menú + evento) — 1 SQL query total ===
@router.get("/historial")
async def listar_historial(
    limite: int = Query(LIMIT_DEFAULT, ge=1, le=1000),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    menus = await _cargar_docs(coleccion_menus, limite)
    eventos = await _cargar_docs(coleccion_eventos, limite)

    todos = menus + eventos
    nombres_map = _resolver_nombres(db, todos)

    resultado = [_serializar(m, "menu", "menus", nombres_map) for m in menus]
    resultado += [_serializar(e, "evento", "eventos", nombres_map) for e in eventos]
    resultado.sort(key=lambda x: x["fecha_subida"] or "", reverse=True)
    return resultado


# === HISTORIAL SOLO MENÚS ===
@router.get("/historial/menus")
async def historial_menus(
    limite: int = Query(LIMIT_DEFAULT, ge=1, le=1000),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    docs = await _cargar_docs(coleccion_menus, limite)
    nombres_map = _resolver_nombres(db, docs)
    return [_serializar(d, "menu", "menus", nombres_map) for d in docs]


# === HISTORIAL SOLO EVENTOS ===
@router.get("/historial/eventos")
async def historial_eventos(
    limite: int = Query(LIMIT_DEFAULT, ge=1, le=1000),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    docs = await _cargar_docs(coleccion_eventos, limite)
    nombres_map = _resolver_nombres(db, docs)
    return [_serializar(d, "evento", "eventos", nombres_map) for d in docs]
