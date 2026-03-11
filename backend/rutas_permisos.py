# ============================================
# RUTAS PERMISOS — Gestión de submódulos por ROL
# Usa las tablas existentes: permiso_accs + asignacion_accs
# Solo ADMINISTRADOR puede gestionar permisos.
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import (
    get_db, Personal, Acceso, Contrato, Cargo,
    RolAccs, EstadoAccs, Area,
    PermisoAccs, AsignacionAccs,
)
from auth_token import verificar_token

router = APIRouter()


def _es_admin(token: dict) -> bool:
    rol = (token.get("rol") or "").strip().upper()
    return rol in ("ADMINISTRADOR", "ADMIN")


# ── Catálogo: submódulos disponibles ─────────────
@router.get("/permisos/submodulos")
def listar_submodulos(db: Session = Depends(get_db), _: dict = Depends(verificar_token)):
    """Devuelve todos los submódulos registrados en permiso_accs."""
    if not PermisoAccs:
        return []
    return [
        {"id": p.ID_PERM, "nombre": p.DESCRIP}
        for p in db.query(PermisoAccs).order_by(PermisoAccs.ID_PERM).all()
    ]


# ── Roles con sus permisos asignados ─────────────
@router.get("/permisos/roles")
def listar_roles_permisos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Devuelve todos los roles con sus submódulos asignados."""
    if not _es_admin(token):
        raise HTTPException(status_code=403, detail="Solo ADMINISTRADOR puede gestionar permisos")

    roles = db.query(RolAccs).order_by(RolAccs.ID_ROL).all()
    permisos = db.query(PermisoAccs).order_by(PermisoAccs.ID_PERM).all() if PermisoAccs else []
    asignaciones = db.query(AsignacionAccs).all() if AsignacionAccs else []

    # Mapa: {id_rol: [id_perm, ...]}
    asig_map = {}
    for a in asignaciones:
        asig_map.setdefault(a.ID_ROL, []).append(a.ID_PERM)

    resultado = []
    for r in roles:
        ids_perm = asig_map.get(r.ID_ROL, [])
        resultado.append({
            "id_rol": r.ID_ROL,
            "nombre": r.DESCRIP,
            "estado": getattr(r, "ESTADO_ROL", 1),
            "permisos": ids_perm,
        })

    return {
        "roles": resultado,
        "submodulos": [{"id": p.ID_PERM, "nombre": p.DESCRIP} for p in permisos],
    }


# ── Actualizar permisos de un rol ────────────────
class RolPermisosUpdateSchema(BaseModel):
    permisos: List[int]  # lista de ID_PERM


@router.put("/permisos/roles/{id_rol}")
def actualizar_permisos_rol(
    id_rol: int,
    datos: RolPermisosUpdateSchema,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    if not _es_admin(token):
        raise HTTPException(status_code=403, detail="Solo ADMINISTRADOR puede gestionar permisos")
    if not AsignacionAccs:
        raise HTTPException(status_code=500, detail="Tabla asignacion_accs no disponible")

    # Verificar que el rol existe
    rol = db.query(RolAccs).filter(RolAccs.ID_ROL == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Validar IDs de permiso
    permisos_validos = []
    if PermisoAccs:
        existentes = {p.ID_PERM for p in db.query(PermisoAccs).all()}
        permisos_validos = [pid for pid in datos.permisos if pid in existentes]

    # Eliminar asignaciones anteriores de este rol
    db.query(AsignacionAccs).filter(AsignacionAccs.ID_ROL == id_rol).delete()

    # Insertar las nuevas
    for pid in permisos_validos:
        nuevo = AsignacionAccs(ID_ROL=id_rol, ID_PERM=pid)
        db.add(nuevo)

    db.commit()
    return {
        "mensaje": f"Permisos del rol {rol.DESCRIP} actualizados",
        "permisos": permisos_validos,
    }


# ── Personal con sus permisos derivados del rol ──
@router.get("/permisos/usuarios")
def listar_usuarios_permisos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista personal de la empresa con el rol y permisos derivados (solo lectura)."""
    if not _es_admin(token):
        raise HTTPException(status_code=403, detail="Solo ADMINISTRADOR puede gestionar permisos")

    id_empresa = token.get("id_emp")
    roles_map = {r.ID_ROL: r.DESCRIP for r in db.query(RolAccs).all()}
    estados_map = {e.ID_ESTADO: e.DESCRIP for e in db.query(EstadoAccs).all()}
    areas_map = {a.ID_AREA: a.DESCRIP for a in db.query(Area).all()}

    # Permisos por rol
    asig_map = {}
    if AsignacionAccs:
        for a in db.query(AsignacionAccs).all():
            asig_map.setdefault(a.ID_ROL, []).append(a.ID_PERM)
    perm_map = {}
    if PermisoAccs:
        perm_map = {p.ID_PERM: p.DESCRIP for p in db.query(PermisoAccs).all()}

    registros = (
        db.query(Personal, Acceso, Contrato)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .outerjoin(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .outerjoin(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(Cargo.ID_EMP == id_empresa, Contrato.ID_ESTADO_CONTRATO == 1)
        .all()
    )

    resultado = []
    for p, acceso, contrato in registros:
        ids_perm = asig_map.get(acceso.ID_ROL, [])
        modulos = [perm_map[pid] for pid in ids_perm if pid in perm_map]
        resultado.append({
            "id_personal": p.ID_PERSONAL,
            "id_accs": acceso.ID_ACCS,
            "id_rol": acceso.ID_ROL,
            "usuario": acceso.USUARIO,
            "nombre_completo": f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}",
            "foto": p.FOTO,
            "rol": roles_map.get(acceso.ID_ROL, "—"),
            "estado": estados_map.get(acceso.ID_ESTADO, "—"),
            "area": areas_map.get(contrato.ID_AREA, "—") if contrato else "—",
            "modulos": modulos,
        })

    return resultado


# ── Mis módulos (para Sidebar del usuario actual) ─
@router.get("/permisos/mis-modulos")
def mis_modulos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Devuelve DESCRIP de los submódulos asignados al rol del usuario."""
    id_accs = token.get("id_accs")

    if not AsignacionAccs or not PermisoAccs:
        return []

    # Obtener el rol del usuario
    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    if not acceso:
        return []

    asigs = db.query(AsignacionAccs).filter(AsignacionAccs.ID_ROL == acceso.ID_ROL).all()
    perm_ids = [a.ID_PERM for a in asigs]
    if not perm_ids:
        return []

    perms = db.query(PermisoAccs).filter(PermisoAccs.ID_PERM.in_(perm_ids)).all()
    return [p.DESCRIP for p in perms]
