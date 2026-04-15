# rutas_red.py
# CRUD para el módulo de Red — Administración de IPs
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, Red, Equipo, EspecificacionesTec, Personal, Empresa, Contrato, AsignacionEquipo
from auth_token import verificar_token
import traceback

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
    try:
        if not Red:
            return {"ips": [], "grupos": [], "resumen": {}}

        filas = db.query(Red).order_by(Red.IP).all()

        # Mapa de especificaciones para obtener CODIGOE
        espec_map = {}
        if EspecificacionesTec:
            for es in db.query(EspecificacionesTec).all():
                espec_map[es.ID_ESPEC] = getattr(es, 'CODIGOE', None)

        # Mapa de equipos para evitar N+1
        equipo_map = {}
        if Equipo:
            for e in db.query(Equipo).all():
                id_espec = getattr(e, 'ID_ESPEC', None)
                equipo_map[e.ID_EQUIPO] = {
                    "id": e.ID_EQUIPO,
                    "serie": getattr(e, 'SERIE_EQUIPO', None),
                    "nombre": getattr(e, 'NOMBRE_EQUIPO', None),
                    "codigoe": espec_map.get(id_espec) if id_espec else None,
                }

        # Mapa de personal (todos, de todas las empresas)
        personal_map = {}
        if Personal:
            for p in db.query(Personal).all():
                personal_map[p.ID_PERSONAL] = {
                    "id": p.ID_PERSONAL,
                    "nombre": getattr(p, 'NOMBRES', '') or '',
                    "apellido_pat": getattr(p, 'APE_PATERNO', '') or '',
                    "apellido_mat": getattr(p, 'APE_MATERNO', '') or '',
                }

        # Mapa equipo → personal asignado (desde asignacion_equipo)
        equipo_personal_map = {}
        if AsignacionEquipo:
            for a in db.query(AsignacionEquipo).all():
                # Si hay varias asignaciones por equipo, la última gana
                equipo_personal_map[a.ID_EQUIPO] = a.ID_PERSONAL

        lista = []
        for f in filas:
            etiqueta = f.ETIQUETAS if f.ETIQUETAS else None
            # Resolver personal asignado al equipo de esta IP
            id_personal_asignado = equipo_personal_map.get(f.ID_EQUIPO) if f.ID_EQUIPO else None
            lista.append({
                "id_ip": f.ID_IP,
                "ip": f.IP,
                "etiqueta": etiqueta,
                "descripcion": f.DESCRIP,
                "id_equipo": f.ID_EQUIPO,
                "equipo": equipo_map.get(f.ID_EQUIPO) if f.ID_EQUIPO else None,
                "personal": personal_map.get(id_personal_asignado) if id_personal_asignado else None,
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

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al listar IPs")


# ═══════════════════════════════════════════
#  CATÁLOGOS (etiquetas + equipos + personal de todas las empresas)
# ═══════════════════════════════════════════
@router.get("/red/catalogos")
def catalogos_red(db: Session = Depends(get_db), _=Depends(verificar_token)):
    try:
        # Mapa de especificaciones para obtener CODIGOE
        espec_map = {}
        if EspecificacionesTec:
            for es in db.query(EspecificacionesTec).all():
                espec_map[es.ID_ESPEC] = getattr(es, 'CODIGOE', None)

        equipos = []
        if Equipo:
            for e in db.query(Equipo).order_by(Equipo.ID_EQUIPO).all():
                id_espec = getattr(e, 'ID_ESPEC', None)
                equipos.append({
                    "id": e.ID_EQUIPO,
                    "serie": getattr(e, 'SERIE_EQUIPO', None),
                    "nombre": getattr(e, 'NOMBRE_EQUIPO', None),
                    "codigoe": espec_map.get(id_espec) if id_espec else None,
                })

        # Mapa de empresas para el nombre
        empresa_map = {}
        if Empresa:
            for emp in db.query(Empresa).all():
                empresa_map[emp.ID_EMP] = getattr(emp, 'NOMBRE', '') or f'Empresa #{emp.ID_EMP}'

        # Personal de TODAS las empresas (empresa via contrato)
        contrato_empresa = {}
        if Contrato:
            for c in db.query(Contrato).all():
                # Guardar solo el primer contrato (o el activo) por personal
                if c.ID_PERSONAL not in contrato_empresa:
                    contrato_empresa[c.ID_PERSONAL] = getattr(c, 'ID_EMP', None)

        personal_list = []
        if Personal:
            for p in db.query(Personal).order_by(Personal.APE_PATERNO, Personal.NOMBRES).all():
                id_emp = contrato_empresa.get(p.ID_PERSONAL)
                personal_list.append({
                    "id": p.ID_PERSONAL,
                    "nombre": getattr(p, 'NOMBRES', '') or '',
                    "apellido_pat": getattr(p, 'APE_PATERNO', '') or '',
                    "apellido_mat": getattr(p, 'APE_MATERNO', '') or '',
                    "empresa": empresa_map.get(id_emp, ''),
                    "id_empresa": id_emp,
                })

        return {"etiquetas": ETIQUETAS_ENUM, "equipos": equipos, "personal": personal_list}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener catálogos")


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
    id_personal: Optional[int] = None


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

    if datos.id_personal is not None:
        if hasattr(ip, 'ID_PERSONAL'):
            ip.ID_PERSONAL = datos.id_personal if datos.id_personal > 0 else None

    db.commit()
    return {"ok": True, "mensaje": "IP actualizada correctamente"}
