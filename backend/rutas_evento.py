import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from mongodb import coleccion_eventos
from auth_token import verificar_token
from database import get_db, Personal

router = APIRouter()

# Carpeta donde se guardan los eventos
EVENTOS_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "eventos")
os.makedirs(EVENTOS_DIR, exist_ok=True)


# ═══════════════════════════════════════════════
# Helper genérico para CRUD de eventos (elimina triplicación)
# ═══════════════════════════════════════════════

async def _subir_evento(coleccion, prefijo: str, tipo: str, id_accs: int, archivo: UploadFile, db: Session):
    timestamp = int(datetime.now().timestamp())
    nombre_archivo = f"{prefijo}_{timestamp}.webp"
    ruta_nueva = os.path.join(EVENTOS_DIR, nombre_archivo)
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    nombre_usuario = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else "Desconocido"
    anterior = await coleccion.find_one(sort=[("fecha_subida", -1)])
    if anterior:
        ruta_vieja = os.path.join(EVENTOS_DIR, anterior["archivo"])
        if os.path.exists(ruta_vieja):
            os.remove(ruta_vieja)
    with open(ruta_nueva, "wb") as f:
        shutil.copyfileobj(archivo.file, f)
    await coleccion.insert_one({
        "archivo": nombre_archivo, "id_accs": id_accs,
        "nombre_usuario": nombre_usuario, "fecha_subida": datetime.now(), "tipo": tipo,
    })
    return {"mensaje": f"{tipo.capitalize()} subido", "archivo": nombre_archivo}


async def _ver_evento(coleccion):
    evento = await coleccion.find_one(sort=[("fecha_subida", -1)])
    if evento:
        return {"archivo": evento["archivo"], "url": f"/assets/eventos/{evento['archivo']}"}
    return {"archivo": None, "url": None}


async def _eliminar_evento(coleccion, label: str):
    evento = await coleccion.find_one(sort=[("fecha_subida", -1)])
    if evento:
        ruta = os.path.join(EVENTOS_DIR, evento["archivo"])
        if os.path.exists(ruta):
            os.remove(ruta)
        await coleccion.delete_one({"_id": evento["_id"]})
    return {"mensaje": f"{label} eliminado"}


# ═══════════════════════════════════════════════
# EVENTO 1 — Principal
# ═══════════════════════════════════════════════

@router.post("/evento")
async def subir_evento(id_accs: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    return await _subir_evento(coleccion_eventos, "evento", "evento", id_accs, archivo, db)

@router.get("/evento")
async def ver_evento(token: dict = Depends(verificar_token)):
    return await _ver_evento(coleccion_eventos)

@router.delete("/evento")
async def eliminar_evento(token: dict = Depends(verificar_token)):
    return await _eliminar_evento(coleccion_eventos, "Evento")


# ═══════════════════════════════════════════════
# EVENTO 2 — Segundo campo
# ═══════════════════════════════════════════════
from mongodb import coleccion_eventos2, coleccion_evento_mujeres

@router.post("/evento2")
async def subir_evento2(id_accs: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    return await _subir_evento(coleccion_eventos2, "evento2", "evento2", id_accs, archivo, db)

@router.get("/evento2")
async def ver_evento2(token: dict = Depends(verificar_token)):
    return await _ver_evento(coleccion_eventos2)

@router.delete("/evento2")
async def eliminar_evento2(token: dict = Depends(verificar_token)):
    return await _eliminar_evento(coleccion_eventos2, "Evento 2")


# ═══════════════════════════════════════════════
# EVENTO MUJERES — Visible solo para género femenino
# ═══════════════════════════════════════════════

@router.post("/evento-mujeres")
async def subir_evento_mujeres(id_accs: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    return await _subir_evento(coleccion_evento_mujeres, "evento_mujeres", "evento_mujeres", id_accs, archivo, db)

@router.get("/evento-mujeres")
async def ver_evento_mujeres(token: dict = Depends(verificar_token)):
    return await _ver_evento(coleccion_evento_mujeres)

@router.delete("/evento-mujeres")
async def eliminar_evento_mujeres(token: dict = Depends(verificar_token)):
    return await _eliminar_evento(coleccion_evento_mujeres, "Evento Mujeres")
