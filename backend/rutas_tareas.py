from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from auth_token import verificar_token
from mongodb import coleccion_tareas

router = APIRouter()


class TareaIn(BaseModel):
    fecha: str            # "YYYY-MM-DD"
    titulo: str
    descripcion: Optional[str] = ""
    hora: Optional[str] = ""   # "HH:MM" opcional
    color: Optional[str] = "#3b82f6"
    recordatorio: Optional[bool] = True


class TareaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    hora: Optional[str] = None
    color: Optional[str] = None
    completada: Optional[bool] = None
    recordatorio: Optional[bool] = None


@router.get("/tareas")
async def listar_tareas(mes: int = 0, anio: int = 0, token: dict = Depends(verificar_token)):
    id_personal = token.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Token sin id_personal")

    filtro = {"id_personal": id_personal}
    if mes and anio:
        prefijo = f"{anio}-{str(mes).zfill(2)}"
        filtro["fecha"] = {"$regex": f"^{prefijo}"}

    cursor = coleccion_tareas.find(filtro).sort("fecha", 1)
    tareas = await cursor.to_list(length=500)
    resultado = []
    for t in tareas:
        resultado.append({
            "id": str(t["_id"]),
            "fecha": t["fecha"],
            "titulo": t.get("titulo", ""),
            "descripcion": t.get("descripcion", ""),
            "hora": t.get("hora", ""),
            "color": t.get("color", "#3b82f6"),
            "completada": t.get("completada", False),
            "recordatorio": t.get("recordatorio", True),
            "creado": t.get("creado", ""),
        })
    return resultado


@router.post("/tareas")
async def crear_tarea(data: TareaIn, token: dict = Depends(verificar_token)):
    id_personal = token.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Token sin id_personal")
    if not data.titulo or not data.titulo.strip():
        raise HTTPException(status_code=400, detail="El título es obligatorio")

    doc = {
        "id_personal": id_personal,
        "fecha": data.fecha,
        "titulo": data.titulo.strip(),
        "descripcion": (data.descripcion or "").strip(),
        "hora": (data.hora or "").strip(),
        "color": data.color or "#3b82f6",
        "completada": False,
        "recordatorio": data.recordatorio if data.recordatorio is not None else True,
        "creado": datetime.now().isoformat(),
    }
    result = await coleccion_tareas.insert_one(doc)
    return {"ok": True, "id": str(result.inserted_id)}


@router.put("/tareas/{id_tarea}")
async def actualizar_tarea(id_tarea: str, data: TareaUpdate, token: dict = Depends(verificar_token)):
    id_personal = token.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Token sin id_personal")

    try:
        oid = ObjectId(id_tarea)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    tarea = await coleccion_tareas.find_one({"_id": oid, "id_personal": id_personal})
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    cambios = {}
    if data.titulo is not None:
        cambios["titulo"] = data.titulo.strip()
    if data.descripcion is not None:
        cambios["descripcion"] = data.descripcion.strip()
    if data.hora is not None:
        cambios["hora"] = data.hora.strip()
    if data.color is not None:
        cambios["color"] = data.color
    if data.completada is not None:
        cambios["completada"] = data.completada
    if data.recordatorio is not None:
        cambios["recordatorio"] = data.recordatorio

    if cambios:
        await coleccion_tareas.update_one({"_id": oid}, {"$set": cambios})

    return {"ok": True}


@router.delete("/tareas/{id_tarea}")
async def eliminar_tarea(id_tarea: str, token: dict = Depends(verificar_token)):
    id_personal = token.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Token sin id_personal")

    try:
        oid = ObjectId(id_tarea)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    result = await coleccion_tareas.delete_one({"_id": oid, "id_personal": id_personal})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"ok": True}


@router.get("/tareas/hoy")
async def tareas_hoy(token: dict = Depends(verificar_token)):
    """Retorna las tareas pendientes para hoy (usado por notificaciones)."""
    id_personal = token.get("id_personal")
    if not id_personal:
        return []

    hoy = datetime.now().strftime("%Y-%m-%d")
    cursor = coleccion_tareas.find({
        "id_personal": id_personal,
        "fecha": hoy,
        "completada": False,
    }).sort("hora", 1)

    tareas = await cursor.to_list(length=50)
    resultado = []
    for t in tareas:
        resultado.append({
            "id": str(t["_id"]),
            "titulo": t.get("titulo", ""),
            "hora": t.get("hora", ""),
            "color": t.get("color", "#3b82f6"),
        })
    return resultado
