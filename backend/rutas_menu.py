import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from mongodb import coleccion_menus
from auth_token import verificar_token
from database import get_db, Personal, Acceso

router = APIRouter()

# Carpeta donde se guardan los menús
MENUS_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "menus")
os.makedirs(MENUS_DIR, exist_ok=True)


# === SUBIR MENÚ (guardar archivo + insertar en MongoDB) ===
@router.post("/menu")
async def subir_menu(id_accs: int, archivo: UploadFile = File(...), db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    timestamp = int(datetime.now().timestamp())
    nombre_archivo = f"menu_{timestamp}.webp"
    ruta_nueva = os.path.join(MENUS_DIR, nombre_archivo)

    # Buscar el nombre del usuario que sube el menú
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    nombre_usuario = (personal.NOMBRES + " " + personal.APE_PATERNO) if personal else "Desconocido"

    # Borrar foto anterior si existe (buscar el último en MongoDB)
    menu_anterior = await coleccion_menus.find_one(sort=[("fecha_subida", -1)])
    if menu_anterior:
        ruta_vieja = os.path.join(MENUS_DIR, menu_anterior["archivo"])
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
        "tipo": "menu",
    }
    await coleccion_menus.insert_one(documento)

    return {"mensaje": "Menú subido", "archivo": nombre_archivo}


# === VER MENÚ ACTUAL (el más reciente) ===
@router.get("/menu")
async def ver_menu(token: dict = Depends(verificar_token)):
    # Buscar el más reciente en MongoDB
    menu = await coleccion_menus.find_one(sort=[("fecha_subida", -1)])
    if menu:
        return {"archivo": menu["archivo"], "url": f"/assets/menus/{menu['archivo']}"}
    return {"archivo": None, "url": None}


# === ELIMINAR MENÚ (borrar archivo + documento) ===
@router.delete("/menu")
async def eliminar_menu(token: dict = Depends(verificar_token)):
    # Buscar el más reciente
    menu = await coleccion_menus.find_one(sort=[("fecha_subida", -1)])
    if menu:
        ruta = os.path.join(MENUS_DIR, menu["archivo"])
        if os.path.exists(ruta):
            os.remove(ruta)
        # Eliminar el documento de MongoDB
        await coleccion_menus.delete_one({"_id": menu["_id"]})
    return {"mensaje": "Menú eliminado"}
