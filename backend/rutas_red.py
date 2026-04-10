# rutas_red.py
# CRUD para el módulo de Red — Administración de IPs
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, Red, Equipo
from auth_token import verificar_token

router = APIRouter()

ETIQUETAS_ENUM = [
    'LIBRE', 'SERVIDORES', 'REPETIDORES', 'NVR', 'CAMARAS',
    'IMPRESORAS', 'GERENCIA', 'COMERCIAL', 'ADMINISTRACION', 'OPERACIONES'
]


# ═══════════════════════════════════════════
#  LISTAR TODAS LAS IPs (agrupadas por etiqueta)
# ═══════════════════════════════════════════
@router.get("/red")
def listar_ips(db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Red:
        return {"ips": [], "grupos": [], "resumen": {}}

    filas = db.query(Red).order_by(Red.IP).all()

    # Mapa de equipos para evitar N+1
    equipo_map = {}
    if Equipo:
        for e in db.query(Equipo).all():
            equipo_map[e.ID_EQUIPO] = {
                "id": e.ID_EQUIPO,
                "serie": getattr(e, 'SERIE_EQUIPO', None),
                "nombre": getattr(e, 'NOMBRE_EQUIPO', None),
            }

    lista = []
    for f in filas:
        etiqueta = f.ETIQUETAS if f.ETIQUETAS else None
        lista.append({
            "id_ip": f.ID_IP,
            "ip": f.IP,
            "etiqueta": etiqueta,
            "descripcion": f.DESCRIP,
            "id_equipo": f.ID_EQUIPO,
            "equipo": equipo_map.get(f.ID_EQUIPO) if f.ID_EQUIPO else None,
        })

    # Resumen: conteo por etiqueta
    resumen = {"SIN_ASIGNAR": 0}
    for et in ETIQUETAS_ENUM:
        resumen[et] = 0
    for ip in lista:
        if ip["etiqueta"]:
            resumen[ip["etiqueta"]] = resumen.get(ip["etiqueta"], 0) + 1
        else:
            resumen["SIN_ASIGNAR"] += 1

    return {"ips": lista, "etiquetas": ETIQUETAS_ENUM, "resumen": resumen}


# ═══════════════════════════════════════════
#  CATÁLOGOS (etiquetas + equipos disponibles)
# ═══════════════════════════════════════════
@router.get("/red/catalogos")
def catalogos_red(db: Session = Depends(get_db), _=Depends(verificar_token)):
    equipos = []
    if Equipo:
        for e in db.query(Equipo).order_by(Equipo.ID_EQUIPO).all():
            equipos.append({
                "id": e.ID_EQUIPO,
                "serie": getattr(e, 'SERIE_EQUIPO', None),
                "nombre": getattr(e, 'NOMBRE_EQUIPO', None),
            })
    return {"etiquetas": ETIQUETAS_ENUM, "equipos": equipos}


# ═══════════════════════════════════════════
#  ACTUALIZAR MÚLTIPLES IPs (asignación masiva)
#  ⚠️ Definir ANTES de /red/{id_ip} para evitar conflicto de rutas
# ═══════════════════════════════════════════
class RedBulkUpdate(BaseModel):
    ids: list[int]
    etiqueta: Optional[str] = None


@router.put("/red/masivo/etiqueta")
def actualizar_masivo(datos: RedBulkUpdate, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Red:
        raise HTTPException(status_code=500, detail="Tabla red no disponible")

    if datos.etiqueta is not None and datos.etiqueta != "" and datos.etiqueta not in ETIQUETAS_ENUM:
        raise HTTPException(status_code=400, detail="Etiqueta inválida")

    etiqueta_val = datos.etiqueta if datos.etiqueta else None

    actualizados = 0
    for id_ip in datos.ids:
        ip = db.query(Red).filter(Red.ID_IP == id_ip).first()
        if ip:
            ip.ETIQUETAS = etiqueta_val
            actualizados += 1

    db.commit()
    return {"ok": True, "actualizados": actualizados}


# ═══════════════════════════════════════════
#  ACTUALIZAR IP (etiqueta, descripción, equipo)
# ═══════════════════════════════════════════
class RedUpdate(BaseModel):
    etiqueta: Optional[str] = None
    descripcion: Optional[str] = None
    id_equipo: Optional[int] = None


@router.put("/red/{id_ip}")
def actualizar_ip(id_ip: int, datos: RedUpdate, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Red:
        raise HTTPException(status_code=500, detail="Tabla red no disponible")

    ip = db.query(Red).filter(Red.ID_IP == id_ip).first()
    if not ip:
        raise HTTPException(status_code=404, detail="IP no encontrada")

    if datos.etiqueta is not None:
        if datos.etiqueta != "" and datos.etiqueta not in ETIQUETAS_ENUM:
            raise HTTPException(status_code=400, detail="Etiqueta inválida")
        ip.ETIQUETAS = datos.etiqueta if datos.etiqueta != "" else None

    if datos.descripcion is not None:
        ip.DESCRIP = datos.descripcion if datos.descripcion.strip() else None

    if datos.id_equipo is not None:
        ip.ID_EQUIPO = datos.id_equipo if datos.id_equipo > 0 else None

    db.commit()
    return {"ok": True, "mensaje": "IP actualizada correctamente"}
