# rutas_catalogos.py
# Responsabilidad: Endpoints de catálogos / tablas de referencia (solo lectura).
# Cada endpoint retorna una lista de {id, nombre} para llenar combos/selects.

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import (
    get_db,
    Area, Departamento, Cargo, TipoContrato,
    EstadoCivil, GradoAcademico, Distrito, Documento,
    TipoFamiliar, AFP, Banco, Moneda, TipoCuenta, Modalidad,
)
from auth_token import verificar_token

router = APIRouter(tags=["Catálogos"])


# ── Catálogos RRHH ──────────────────────────────

@router.get("/areas")
async def listar_areas(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": a.ID_AREA, "nombre": a.DESCRIP}
        for a in db.query(Area).order_by(Area.DESCRIP).all()
    ]


@router.get("/departamentos")
async def listar_departamentos(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": d.ID_DEPART, "nombre": d.DESCRIP}
        for d in db.query(Departamento).order_by(Departamento.DESCRIP).all()
    ]


@router.get("/cargos")
async def listar_cargos(
    id_depart: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    query = db.query(Cargo)
    if id_depart:
        query = query.filter(Cargo.ID_DEPART == id_depart)
    return [
        {"id": c.ID_CARGO, "nombre": c.DESCRIP, "id_depart": c.ID_DEPART}
        for c in query.order_by(Cargo.DESCRIP).all()
    ]


@router.get("/tipos-contrato")
async def listar_tipos_contrato(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": t.ID_TIPOCONTR, "nombre": t.DESCRIP}
        for t in db.query(TipoContrato).order_by(TipoContrato.DESCRIP).all()
    ]


@router.get("/estados-civiles")
async def listar_estados_civiles(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": e.ID_ESTCIVIL, "nombre": e.DESCRIP}
        for e in db.query(EstadoCivil).order_by(EstadoCivil.DESCRIP).all()
    ]


@router.get("/grados")
async def listar_grados(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": g.ID_ACADM, "nombre": g.DESCRIP}
        for g in db.query(GradoAcademico).order_by(GradoAcademico.DESCRIP).all()
    ]


@router.get("/distritos")
async def listar_distritos(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": d.ID_DISTR, "nombre": d.DESCRIP}
        for d in db.query(Distrito).order_by(Distrito.DESCRIP).all()
    ]


@router.get("/tipos-documento")
async def listar_tipos_documento(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": d.ID_DOC, "codigo": d.CODIGO, "nombre": d.DESCRIP}
        for d in db.query(Documento).order_by(Documento.DESCRIP).all()
    ]


@router.get("/tipos-familiar")
async def listar_tipos_familiar(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": t.ID_TIPFAM, "nombre": t.DESCRIP}
        for t in db.query(TipoFamiliar).order_by(TipoFamiliar.DESCRIP).all()
    ]


# ── Catálogos financieros ──────────────────────

@router.get("/afps")
async def listar_afps(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": a.ID_AFP, "nombre": a.DESCRIP}
        for a in db.query(AFP).order_by(AFP.DESCRIP).all()
    ]


@router.get("/bancos")
async def listar_bancos(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": b.ID_BANCO, "nombre": b.DESCRIP}
        for b in db.query(Banco).order_by(Banco.DESCRIP).all()
    ]


@router.get("/monedas")
async def listar_monedas(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": m.ID_MONEDA, "nombre": m.DESCRIP}
        for m in db.query(Moneda).order_by(Moneda.DESCRIP).all()
    ]


@router.get("/tipos-cuenta")
async def listar_tipos_cuenta(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    return [
        {"id": t.ID_TIPO_CUENTA, "nombre": t.DESCRIP}
        for t in db.query(TipoCuenta).order_by(TipoCuenta.DESCRIP).all()
    ]


@router.get("/modalidad")
async def listar_modalidades(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    if not Modalidad:
        return []
    return [
        {"id": m.ID_MODALID, "nombre": m.DESCRIP}
        for m in db.query(Modalidad).order_by(Modalidad.DESCRIP).all()
    ]
