# rutas_mantenimiento.py
# CRUD para el módulo de Mantenimiento de Equipos
import os, uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import (
    get_db, Equipo, TipoEquipo, Marca, Modelo, EspecificacionesTec,
    AsignacionEquipo, Personal, Contrato, Acceso, Mantenimiento, Cargo,
)
from auth_token import verificar_token

router = APIRouter()

# Directorio de uploads para fotos de mantenimiento
MANT_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "mantenimiento")
os.makedirs(MANT_UPLOAD_DIR, exist_ok=True)

# Departamento TI — solo personal de este depto puede ser técnico
DEPTO_TI_ID = 12


# ═══════════════════════════════════════════
#  LISTAR MANTENIMIENTOS
# ═══════════════════════════════════════════
@router.get("/mantenimientos")
def listar_mantenimientos(db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Mantenimiento:
        return []

    filas = db.query(Mantenimiento).order_by(Mantenimiento.FECHA_PROG.desc()).all()

    # Precarga de mapas para evitar N+1
    equipo_map = {}
    if Equipo:
        for e in db.query(Equipo).all():
            equipo_map[e.ID_EQUIPO] = e

    tipo_map = {}
    if TipoEquipo:
        for t in db.query(TipoEquipo).all():
            tipo_map[t.ID_TEQUIPO] = t.DESCRIP

    espec_map = {}
    if EspecificacionesTec:
        for es in db.query(EspecificacionesTec).all():
            espec_map[es.ID_ESPEC] = es

    marca_map = {}
    if Marca:
        for m in db.query(Marca).all():
            marca_map[m.ID_MARCA] = m.DESCRIP

    modelo_map = {}
    if Modelo:
        for m in db.query(Modelo).all():
            modelo_map[m.ID_MODELO] = m.DESCRIP

    personal_map = {}
    if Personal:
        for p in db.query(Personal).all():
            personal_map[p.ID_PERSONAL] = p

    # Mapa de asignaciones activas: equipo -> personal
    asig_map = {}
    if AsignacionEquipo:
        for a in db.query(AsignacionEquipo).filter(AsignacionEquipo.FECHA_DEVOL == None).all():
            asig_map[a.ID_EQUIPO] = a.ID_PERSONAL

    resultado = []
    for m in filas:
        eq = equipo_map.get(m.ID_EQUIPO)
        espec = espec_map.get(eq.ID_ESPEC) if eq else None
        marca_nombre = marca_map.get(espec.ID_MARCA, '') if espec else ''
        modelo_nombre = modelo_map.get(espec.ID_MODELO, '') if espec else ''
        tipo_nombre = tipo_map.get(eq.ID_TEQUIPO, '') if eq else ''
        codigoe = espec.CODIGOE if espec else ''
        serie = eq.SERIE_EQUIPO if eq else ''

        # Técnico
        tec = personal_map.get(m.ID_TECNICO)
        tecnico_nombre = f"{tec.NOMBRES} {tec.APE_PATERNO}" if tec else ''

        # Usuario asignado al equipo
        id_usuario = asig_map.get(m.ID_EQUIPO)
        usr = personal_map.get(id_usuario)
        usuario_nombre = f"{usr.NOMBRES} {usr.APE_PATERNO}" if usr else 'Sin asignar'

        resultado.append({
            "id": m.ID_MANTENIMIENTO,
            "id_equipo": m.ID_EQUIPO,
            "id_tecnico": m.ID_TECNICO,
            "tipo_equipo": tipo_nombre,
            "marca": marca_nombre,
            "modelo": modelo_nombre,
            "codigoe": codigoe,
            "serie": serie,
            "tecnico": tecnico_nombre,
            "usuario_equipo": usuario_nombre,
            "tipo_mantenimiento": m.TIPO_MANTENIMIENTO,
            "estado": m.ESTADO,
            "tipo_periodo": m.TIPO_PERIODO,
            "fecha_mant": m.FECHA_MANT.isoformat() if m.FECHA_MANT else '',
            "fecha_prog": m.FECHA_PROG.isoformat() if m.FECHA_PROG else '',
            "detalle": m.DETALLE_MANT or '',
            "foto1": m.FOTO1 or '',
            "foto2": m.FOTO2 or '',
        })

    return resultado


# ═══════════════════════════════════════════
#  CATÁLOGOS PARA EL FORMULARIO
# ═══════════════════════════════════════════
@router.get("/mantenimientos/catalogos")
def catalogos_mantenimiento(db: Session = Depends(get_db), _=Depends(verificar_token)):
    # Equipos asignados (con info completa)
    equipos_asig = []
    if AsignacionEquipo and Equipo:
        asignaciones = db.query(AsignacionEquipo).filter(
            AsignacionEquipo.FECHA_DEVOL == None
        ).all()

        equipo_map = {}
        for e in db.query(Equipo).all():
            equipo_map[e.ID_EQUIPO] = e

        tipo_map = {}
        if TipoEquipo:
            for t in db.query(TipoEquipo).all():
                tipo_map[t.ID_TEQUIPO] = t.DESCRIP

        espec_map = {}
        if EspecificacionesTec:
            for es in db.query(EspecificacionesTec).all():
                espec_map[es.ID_ESPEC] = es

        marca_map = {}
        if Marca:
            for m in db.query(Marca).all():
                marca_map[m.ID_MARCA] = m.DESCRIP

        modelo_map = {}
        if Modelo:
            for m in db.query(Modelo).all():
                modelo_map[m.ID_MODELO] = m.DESCRIP

        personal_map = {}
        if Personal:
            for p in db.query(Personal).all():
                personal_map[p.ID_PERSONAL] = p

        for a in asignaciones:
            eq = equipo_map.get(a.ID_EQUIPO)
            if not eq:
                continue
            espec = espec_map.get(eq.ID_ESPEC)
            marca_n = marca_map.get(espec.ID_MARCA, '') if espec else ''
            modelo_n = modelo_map.get(espec.ID_MODELO, '') if espec else ''
            tipo_n = tipo_map.get(eq.ID_TEQUIPO, '') if eq else ''
            codigoe = espec.CODIGOE if espec else ''
            usr = personal_map.get(a.ID_PERSONAL)
            usr_nombre = f"{usr.NOMBRES} {usr.APE_PATERNO}" if usr else '?'

            equipos_asig.append({
                "id_equipo": eq.ID_EQUIPO,
                "label": f"{codigoe or eq.SERIE_EQUIPO} — {marca_n} {modelo_n} ({tipo_n}) → {usr_nombre}",
                "codigoe": codigoe,
                "serie": eq.SERIE_EQUIPO,
                "marca": marca_n,
                "modelo": modelo_n,
                "tipo": tipo_n,
                "usuario": usr_nombre,
                "id_personal": a.ID_PERSONAL,
            })

    # Técnicos: solo personal del departamento TI (soporte)
    tecnicos = []
    if Personal and Acceso and Contrato and Cargo:
        filas = (
            db.query(Personal, Contrato)
            .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
            .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(
                Acceso.ID_ESTADO == 1,
                Contrato.ID_ESTADO_CONTRATO == 1,
                Cargo.ID_DEPART == DEPTO_TI_ID,
            )
            .all()
        )
        vistos = set()
        for p, co in filas:
            if p.ID_PERSONAL in vistos:
                continue
            vistos.add(p.ID_PERSONAL)
            tecnicos.append({
                "id": p.ID_PERSONAL,
                "nombre": f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            })
        tecnicos.sort(key=lambda x: x["nombre"])

    return {
        "equipos": equipos_asig,
        "tecnicos": tecnicos,
        "tipos_mantenimiento": ["PREVENTIVO", "PROGRAMADO", "REPARACION"],
        "estados": ["PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO"],
        "periodos": ["TRIMESTRAL", "SEMESTRAL", "ANUAL"],
    }


# ═══════════════════════════════════════════
#  CREAR MANTENIMIENTO
# ═══════════════════════════════════════════
class MantBody(BaseModel):
    id_equipo: int
    id_tecnico: Optional[int] = None
    tipo_mantenimiento: str
    tipo_periodo: str
    fecha_prog: str
    fecha_mant: Optional[str] = None
    detalle: str = ''
    estado: str = 'PENDIENTE'


@router.post("/mantenimientos")
def crear_mantenimiento(body: MantBody, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Mantenimiento:
        raise HTTPException(status_code=500, detail="Tabla mantenimiento no disponible")

    try:
        fecha_prog = datetime.fromisoformat(body.fecha_prog) if body.fecha_prog else datetime.now()
        fecha_mant = datetime.fromisoformat(body.fecha_mant) if body.fecha_mant else fecha_prog

        nuevo = Mantenimiento(
            ID_EQUIPO=body.id_equipo,
            ID_TECNICO=body.id_tecnico,
            TIPO_MANTENIMIENTO=body.tipo_mantenimiento,
            ESTADO=body.estado,
            TIPO_PERIODO=body.tipo_periodo,
            FECHA_PROG=fecha_prog,
            FECHA_MANT=fecha_mant,
            DETALLE_MANT=body.detalle.strip(),
        )
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return {"ok": True, "id": nuevo.ID_MANTENIMIENTO}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════
#  ACTUALIZAR MANTENIMIENTO
# ═══════════════════════════════════════════
@router.put("/mantenimientos/{id_mant}")
def actualizar_mantenimiento(id_mant: int, body: MantBody, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Mantenimiento:
        raise HTTPException(status_code=500, detail="Tabla mantenimiento no disponible")

    mant = db.query(Mantenimiento).filter(Mantenimiento.ID_MANTENIMIENTO == id_mant).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    try:
        mant.ID_EQUIPO = body.id_equipo
        mant.ID_TECNICO = body.id_tecnico
        mant.TIPO_MANTENIMIENTO = body.tipo_mantenimiento
        mant.ESTADO = body.estado
        mant.TIPO_PERIODO = body.tipo_periodo
        mant.FECHA_PROG = datetime.fromisoformat(body.fecha_prog) if body.fecha_prog else mant.FECHA_PROG
        mant.FECHA_MANT = datetime.fromisoformat(body.fecha_mant) if body.fecha_mant else mant.FECHA_MANT
        mant.DETALLE_MANT = body.detalle.strip()
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════
#  ELIMINAR MANTENIMIENTO
# ═══════════════════════════════════════════
@router.delete("/mantenimientos/{id_mant}")
def eliminar_mantenimiento(id_mant: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Mantenimiento:
        raise HTTPException(status_code=500, detail="Tabla mantenimiento no disponible")

    mant = db.query(Mantenimiento).filter(Mantenimiento.ID_MANTENIMIENTO == id_mant).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    try:
        db.delete(mant)
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════
#  CAMBIAR ESTADO RÁPIDO
# ═══════════════════════════════════════════
class EstadoBody(BaseModel):
    estado: str


@router.patch("/mantenimientos/{id_mant}/estado")
def cambiar_estado(id_mant: int, body: EstadoBody, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Mantenimiento:
        raise HTTPException(status_code=500, detail="Tabla mantenimiento no disponible")

    mant = db.query(Mantenimiento).filter(Mantenimiento.ID_MANTENIMIENTO == id_mant).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    try:
        mant.ESTADO = body.estado
        if body.estado == 'COMPLETADO' and not mant.FECHA_MANT:
            mant.FECHA_MANT = datetime.now()
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════
#  SUBIR FOTO DE MANTENIMIENTO
# ═══════════════════════════════════════════
@router.post("/mantenimientos/{id_mant}/foto/{num}")
async def subir_foto_mant(
    id_mant: int,
    num: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(verificar_token),
):
    if num not in (1, 2):
        raise HTTPException(status_code=400, detail="num debe ser 1 o 2")
    if not Mantenimiento:
        raise HTTPException(status_code=500, detail="Tabla no disponible")

    mant = db.query(Mantenimiento).filter(Mantenimiento.ID_MANTENIMIENTO == id_mant).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    ext = os.path.splitext(foto.filename)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
        raise HTTPException(status_code=400, detail="Solo JPG, PNG o WEBP")
    contenido = await foto.read()
    if len(contenido) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Máximo 5 MB")

    nombre = f"mant_{id_mant}_f{num}_{uuid.uuid4().hex[:8]}{ext}"
    ruta = os.path.join(MANT_UPLOAD_DIR, nombre)
    with open(ruta, "wb") as f:
        f.write(contenido)

    url_rel = f"assets/mantenimiento/{nombre}"
    try:
        # Borrar foto anterior si existe
        vieja = getattr(mant, f"FOTO{num}", None)
        if vieja:
            vieja_path = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", vieja)
            if os.path.exists(vieja_path):
                os.remove(vieja_path)
        setattr(mant, f"FOTO{num}", url_rel)
        db.commit()
        return {"ok": True, "url": url_rel}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
