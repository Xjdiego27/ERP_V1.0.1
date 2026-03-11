# ============================================
# RUTAS DOCUMENTOS — Gestión de documentos
# por trabajador (contrato, memorando, adenda,
# carta de compromiso, liquidación, etc.)
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import (
    get_db, Personal, Contrato, Acceso, Area, Cargo,
    Anexos, TipoDocumentoLab, MotivoDoc
)
from auth_token import verificar_token

router = APIRouter()


# ─── SCHEMAS ────────────────────────────────────

class DocumentoCrear(BaseModel):
    id_contr: Optional[int] = None
    id_tdocument: int
    id_tmotivo: Optional[int] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    sueldo: Optional[str] = None
    id_area: int
    id_cargo: int

class DocumentoEditar(BaseModel):
    id_tdocument: Optional[int] = None
    id_tmotivo: Optional[int] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    sueldo: Optional[str] = None
    id_area: Optional[int] = None
    id_cargo: Optional[int] = None


# ─── CATÁLOGOS ──────────────────────────────────

@router.get("/documentos/tipos")
def listar_tipos_documento_lab(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Retorna los tipos de documento laboral (CONTRATO, ADENDAS, MEMORANDUM, etc.)."""
    if not TipoDocumentoLab:
        return []
    rows = db.query(TipoDocumentoLab).all()
    return [{"id": r.ID_TDOCUMENT, "descrip": r.DESCRIP} for r in rows]


@router.get("/documentos/motivos")
def listar_motivos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Retorna los motivos (VACACIONES, TARDANZAS, FALTAS, RENOVACION)."""
    if not MotivoDoc:
        return []
    rows = db.query(MotivoDoc).all()
    return [{"id": r.ID_TMOTIVO, "descrip": r.DESCRIP} for r in rows]


# ─── LISTAR DOCUMENTOS DE UN TRABAJADOR ────────

@router.get("/personal/{id_personal}/documentos")
def listar_documentos(id_personal: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Documentos asociados a un trabajador (a través de su contrato)."""
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Obtener contrato(s)
    contratos = db.query(Contrato).filter(Contrato.ID_PERSONAL == id_personal).all() if Contrato else []
    ids_contr = [c.ID_CONTR for c in contratos]

    if not Anexos or not ids_contr:
        return []

    docs = db.query(Anexos).filter(Anexos.ID_CONTR.in_(ids_contr)).order_by(Anexos.ID_DOCUMENT.desc()).all()

    resultado = []
    for d in docs:
        # Tipo de documento
        tipo = db.query(TipoDocumentoLab).filter(TipoDocumentoLab.ID_TDOCUMENT == d.ID_TDOCUMENT).first() if TipoDocumentoLab and d.ID_TDOCUMENT else None
        # Motivo
        motivo = db.query(MotivoDoc).filter(MotivoDoc.ID_TMOTIVO == d.ID_TMOTIVO).first() if MotivoDoc and d.ID_TMOTIVO else None
        # Area
        area = db.query(Area).filter(Area.ID_AREA == d.ID_AREA).first() if d.ID_AREA else None
        # Cargo
        cargo = db.query(Cargo).filter(Cargo.ID_CARGO == d.ID_CARGO).first() if d.ID_CARGO else None

        resultado.append({
            "id": d.ID_DOCUMENT,
            "id_contr": d.ID_CONTR,
            "id_tdocument": d.ID_TDOCUMENT,
            "tipo_documento": tipo.DESCRIP if tipo else None,
            "id_tmotivo": d.ID_TMOTIVO,
            "motivo": motivo.DESCRIP if motivo else None,
            "fecha_inicio": str(d.FECHA_INICIO) if d.FECHA_INICIO else None,
            "fecha_fin": str(d.FECHA_FIN) if d.FECHA_FIN else None,
            "sueldo": d.SUELDO,
            "id_area": d.ID_AREA,
            "area": area.DESCRIP if area else None,
            "id_cargo": d.ID_CARGO,
            "cargo": cargo.DESCRIP if cargo else None,
        })

    return resultado


# ─── CREAR DOCUMENTO ───────────────────────────

@router.post("/personal/{id_personal}/documentos")
def crear_documento(id_personal: int, data: DocumentoCrear, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Anexos:
        raise HTTPException(status_code=500, detail="Tabla anexos no disponible")

    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Si no se proporciona id_contr, usar el contrato vigente del empleado
    id_contr = data.id_contr
    if not id_contr:
        contrato = db.query(Contrato).filter(Contrato.ID_PERSONAL == id_personal, Contrato.ID_ESTADO_CONTRATO == 1).first() if Contrato else None
        if contrato:
            id_contr = contrato.ID_CONTR

    nuevo = Anexos(
        ID_CONTR=id_contr,
        ID_TDOCUMENT=data.id_tdocument,
        ID_TMOTIVO=data.id_tmotivo,
        FECHA_INICIO=data.fecha_inicio,
        FECHA_FIN=data.fecha_fin,
        SUELDO=data.sueldo,
        ID_AREA=data.id_area,
        ID_CARGO=data.id_cargo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"ok": True, "id": nuevo.ID_DOCUMENT, "mensaje": "Documento creado"}


# ─── EDITAR DOCUMENTO ──────────────────────────

@router.put("/documentos/{id_doc}")
def editar_documento(id_doc: int, data: DocumentoEditar, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Anexos:
        raise HTTPException(status_code=500, detail="Tabla anexos no disponible")

    doc = db.query(Anexos).filter(Anexos.ID_DOCUMENT == id_doc).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if data.id_tdocument is not None:
        doc.ID_TDOCUMENT = data.id_tdocument
    if data.id_tmotivo is not None:
        doc.ID_TMOTIVO = data.id_tmotivo
    if data.fecha_inicio is not None:
        doc.FECHA_INICIO = data.fecha_inicio
    if data.fecha_fin is not None:
        doc.FECHA_FIN = data.fecha_fin
    if data.sueldo is not None:
        doc.SUELDO = data.sueldo
    if data.id_area is not None:
        doc.ID_AREA = data.id_area
    if data.id_cargo is not None:
        doc.ID_CARGO = data.id_cargo

    db.commit()
    return {"ok": True, "mensaje": "Documento actualizado"}


# ─── ELIMINAR DOCUMENTO ────────────────────────

@router.delete("/documentos/{id_doc}")
def eliminar_documento(id_doc: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Anexos:
        raise HTTPException(status_code=500, detail="Tabla anexos no disponible")

    doc = db.query(Anexos).filter(Anexos.ID_DOCUMENT == id_doc).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    db.delete(doc)
    db.commit()
    return {"ok": True, "mensaje": "Documento eliminado"}
