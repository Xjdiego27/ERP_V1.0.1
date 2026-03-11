# ============================================
# RUTAS HORARIO — Gestión de horarios por empresa
# Permite crear horarios, editar detalles y
# asignar horario individual a cada trabajador
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from database import (
    get_db, Personal, Acceso, Contrato, Cargo,
    Horario, HorarioDetalle
)
from auth_token import verificar_token

router = APIRouter()

DIA_NOMBRE = {1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
              5: "Viernes", 6: "Sábado", 7: "Domingo"}


# ─── SCHEMAS ────────────────────────────────────

class DetalleHorario(BaseModel):
    dia: int          # 1=Lun .. 7=Dom
    hora_e: Optional[str] = None
    hora_s: Optional[str] = None
    descanso: bool = False

class HorarioCrear(BaseModel):
    nombre: str
    descrip: Optional[str] = ""
    id_empresa: int
    dias: List[DetalleHorario]

class HorarioEditar(BaseModel):
    nombre: Optional[str] = None
    descrip: Optional[str] = None
    dias: Optional[List[DetalleHorario]] = None

class AsignarHorario(BaseModel):
    id_personal: int
    id_horario: int


# ─── LISTAR HORARIOS DE LA EMPRESA ─────────────

@router.get("/horarios")
def listar_horarios(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista todos los horarios de la empresa del usuario logueado, con su detalle semanal."""
    if not Horario or not HorarioDetalle:
        return []

    id_empresa = token.get("id_emp")
    horarios = db.query(Horario).filter(Horario.ID_EMP == id_empresa).order_by(Horario.NOMBRE).all()

    resultado = []
    for h in horarios:
        detalles = db.query(HorarioDetalle).filter(
            HorarioDetalle.ID_HORARIO == h.ID_HORARIO
        ).order_by(HorarioDetalle.DIA).all()

        resultado.append({
            "id": h.ID_HORARIO,
            "nombre": h.NOMBRE,
            "descrip": getattr(h, "DESCRIP", ""),
            "estado": getattr(h, "ESTADO", 1),
            "dias": [{
                "id_hdet": d.ID_HDET,
                "dia": d.DIA,
                "dia_nombre": DIA_NOMBRE.get(d.DIA, ""),
                "hora_e": str(d.HORA_E) if d.HORA_E else None,
                "hora_s": str(d.HORA_S) if d.HORA_S else None,
                "descanso": bool(getattr(d, "DIA_DESC", 0))
            } for d in detalles]
        })
    return resultado


# ─── CREAR HORARIO ──────────────────────────────

@router.post("/horarios")
def crear_horario(data: HorarioCrear, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Crea un nuevo horario con sus 7 días de detalle."""
    if not Horario or not HorarioDetalle:
        raise HTTPException(status_code=500, detail="Tablas de horario no disponibles")

    id_empresa = token.get("id_emp")
    nuevo = Horario()
    nuevo.NOMBRE = data.nombre
    nuevo.DESCRIP = data.descrip or ""
    nuevo.ESTADO = 1
    nuevo.ID_EMP = id_empresa
    db.add(nuevo)
    db.flush()  # obtener ID generado

    for d in data.dias:
        det = HorarioDetalle()
        det.ID_HORARIO = nuevo.ID_HORARIO
        det.DIA = d.dia
        det.HORA_E = d.hora_e if not d.descanso else None
        det.HORA_S = d.hora_s if not d.descanso else None
        det.DIA_DESC = 1 if d.descanso else 0
        db.add(det)

    db.commit()
    return {"ok": True, "id": nuevo.ID_HORARIO, "mensaje": "Horario creado"}


# ─── LISTAR PERSONAL CON SU HORARIO ─────────────
# (DEBE ir ANTES de /horarios/{id_horario} para evitar conflicto de rutas)

@router.get("/horarios/personal")
def listar_personal_horarios(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista todos los trabajadores de la empresa con su horario asignado."""
    if not Horario:
        return []

    id_empresa = token.get("id_emp")

    registros = db.query(Personal, Contrato, Cargo, Horario).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).outerjoin(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).outerjoin(
        Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
    ).outerjoin(
        Horario, Horario.ID_HORARIO == Contrato.ID_HORARIO
    ).filter(
        Cargo.ID_EMP == id_empresa,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).all()

    resultado = []
    for p, contrato, cargo_obj, horario in registros:
        nombre_comp = f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}"
        resultado.append({
            "id_personal": p.ID_PERSONAL,
            "nombre": nombre_comp,
            "dni": getattr(p, "NUM_DOC", ""),
            "cargo": getattr(cargo_obj, "DESCRIP", "") if cargo_obj else "",
            "foto": getattr(p, "FOTO", None),
            "id_horario": (getattr(contrato, "ID_HORARIO", 1) or 1) if contrato else 1,
            "horario_nombre": horario.NOMBRE if horario else "Sin horario",
        })

    return resultado


# ─── ASIGNAR HORARIO A UN TRABAJADOR ────────────
# (DEBE ir ANTES de /horarios/{id_horario} para evitar conflicto de rutas)

@router.put("/horarios/asignar")
def asignar_horario(data: AsignarHorario, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Asigna un horario específico a un trabajador."""
    p = db.query(Personal).filter(Personal.ID_PERSONAL == data.id_personal).first()
    if not p:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    if Horario:
        h = db.query(Horario).filter(Horario.ID_HORARIO == data.id_horario).first()
        if not h:
            raise HTTPException(status_code=404, detail="Horario no encontrado")

    c = db.query(Contrato).filter(Contrato.ID_PERSONAL == data.id_personal, Contrato.ID_ESTADO_CONTRATO == 1).first()
    if not c:
        raise HTTPException(status_code=404, detail="El trabajador no tiene contrato")
    db.execute(text("UPDATE contrato SET ID_HORARIO = :id_h WHERE ID_PERSONAL = :id_p AND ID_ESTADO_CONTRATO = 1"),
               {"id_h": data.id_horario, "id_p": data.id_personal})
    db.commit()
    return {"ok": True, "mensaje": f"Horario asignado a {p.NOMBRES} {p.APE_PATERNO}"}


# ─── ASIGNACIÓN MASIVA ──────────────────────────
# (DEBE ir ANTES de /horarios/{id_horario} para evitar conflicto de rutas)

class AsignarMasivo(BaseModel):
    ids_personal: List[int]
    id_horario: int

@router.put("/horarios/asignar-masivo")
def asignar_masivo(data: AsignarMasivo, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Asigna un mismo horario a varios trabajadores a la vez."""
    if Horario:
        h = db.query(Horario).filter(Horario.ID_HORARIO == data.id_horario).first()
        if not h:
            raise HTTPException(status_code=404, detail="Horario no encontrado")

    count = 0
    for id_p in data.ids_personal:
        c = db.query(Contrato).filter(Contrato.ID_PERSONAL == id_p, Contrato.ID_ESTADO_CONTRATO == 1).first()
        if c:
            db.execute(text("UPDATE contrato SET ID_HORARIO = :id_h WHERE ID_PERSONAL = :id_p AND ID_ESTADO_CONTRATO = 1"),
                       {"id_h": data.id_horario, "id_p": id_p})
            count += 1

    db.commit()
    return {"ok": True, "mensaje": f"Horario asignado a {count} trabajador(es)"}


# ─── EDITAR HORARIO ─────────────────────────────
# (Rutas con {id_horario} van AL FINAL para evitar conflicto con rutas fijas)

@router.put("/horarios/{id_horario}")
def editar_horario(id_horario: int, data: HorarioEditar, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Edita nombre/descripción y/o los 7 días de un horario existente."""
    if not Horario or not HorarioDetalle:
        raise HTTPException(status_code=500, detail="Tablas de horario no disponibles")

    h = db.query(Horario).filter(Horario.ID_HORARIO == id_horario).first()
    if not h:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    if data.nombre is not None:
        h.NOMBRE = data.nombre
    if data.descrip is not None:
        h.DESCRIP = data.descrip

    if data.dias is not None:
        # Borrar detalles anteriores y recrear
        db.query(HorarioDetalle).filter(HorarioDetalle.ID_HORARIO == id_horario).delete()
        for d in data.dias:
            det = HorarioDetalle()
            det.ID_HORARIO = id_horario
            det.DIA = d.dia
            det.HORA_E = d.hora_e if not d.descanso else None
            det.HORA_S = d.hora_s if not d.descanso else None
            det.DIA_DESC = 1 if d.descanso else 0
            db.add(det)

    db.commit()
    return {"ok": True, "mensaje": "Horario actualizado"}


# ─── ELIMINAR / DESACTIVAR HORARIO ──────────────

@router.delete("/horarios/{id_horario}")
def eliminar_horario(id_horario: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Desactiva un horario (no se elimina, se pone ESTADO=0). No se puede desactivar si hay personal asignado."""
    if not Horario:
        raise HTTPException(status_code=500, detail="Tabla horario no disponible")

    h = db.query(Horario).filter(Horario.ID_HORARIO == id_horario).first()
    if not h:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    # Verificar que no haya personal usando este horario
    asignados = db.query(Contrato).filter(Contrato.ID_HORARIO == id_horario).count()
    if asignados > 0:
        raise HTTPException(status_code=400, detail=f"No se puede desactivar: {asignados} trabajador(es) usan este horario")

    h.ESTADO = 0
    db.commit()
    return {"ok": True, "mensaje": "Horario desactivado"}
