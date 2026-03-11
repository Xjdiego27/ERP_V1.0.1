import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from mongodb import coleccion_eventos
from auth_token import verificar_token
from database import get_db, Personal, Acceso

router = APIRouter()

# Carpeta donde se guardan los eventos
EVENTOS_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "eventos")
os.makedirs(EVENTOS_DIR, exist_ok=True)


# === SUBIR EVENTO (guardar archivo + insertar en MongoDB) ===
@router.post("/evento")
async def subir_evento(id_accs: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    timestamp = int(datetime.now().timestamp())
    nombre_archivo = f"evento_{timestamp}.webp"
    ruta_nueva = os.path.join(EVENTOS_DIR, nombre_archivo)

    # Buscar el nombre del usuario que sube el evento
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    nombre_usuario = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else "Desconocido"

    # Borrar foto anterior si existe (buscar el último documento en MongoDB)
    anterior = await coleccion_eventos.find_one(sort=[("fecha_subida", -1)])
    if anterior:
        ruta_vieja = os.path.join(EVENTOS_DIR, anterior["archivo"])
        if os.path.exists(ruta_vieja):
            os.remove(ruta_vieja)

    # Guardar foto nueva en disco
    with open(ruta_nueva, "wb") as f:
        shutil.copyfileobj(archivo.file, f)

    # Insertar documento en MongoDB (incluye nombre del usuario)
    documento = {
        "archivo": nombre_archivo,
        "id_accs": id_accs,
        "nombre_usuario": nombre_usuario,
        "fecha_subida": datetime.now(),
        "tipo": "evento",
    }
    await coleccion_eventos.insert_one(documento)

    return {"mensaje": "Evento subido", "archivo": nombre_archivo}


# === VER EVENTO ACTUAL (el más reciente) ===
@router.get("/evento")
async def ver_evento(token: dict = Depends(verificar_token)):
    # Buscar el más reciente en MongoDB
    evento = await coleccion_eventos.find_one(sort=[("fecha_subida", -1)])
    if evento:
        return {"archivo": evento["archivo"], "url": f"/assets/eventos/{evento['archivo']}"}
    return {"archivo": None, "url": None}


# === ELIMINAR EVENTO (borrar archivo + documento) ===
@router.delete("/evento")
async def eliminar_evento(token: dict = Depends(verificar_token)):
    # Buscar el más reciente
    evento = await coleccion_eventos.find_one(sort=[("fecha_subida", -1)])
    if evento:
        ruta = os.path.join(EVENTOS_DIR, evento["archivo"])
        if os.path.exists(ruta):
            os.remove(ruta)
        # Eliminar el documento de MongoDB
        await coleccion_eventos.delete_one({"_id": evento["_id"]})
    return {"mensaje": "Evento eliminado"}
