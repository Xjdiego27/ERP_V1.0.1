# ============================================
# RUTAS PERMISOS — Gestión de submódulos por ROL (POO)
# Delega TODA la lógica a PermisoService.
# Lógica SEPARADA del acceso a empresas.
# Solo ADMINISTRADOR puede gestionar permisos.
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import get_db, Acceso
from auth_token import verificar_token
from servicios.permiso_service import PermisoService

router = APIRouter()


# ── Helpers de autorización ──────────────────────

def _es_admin(token: dict) -> bool:
    rol = (token.get("rol") or "").strip().upper()
    return rol in ("ADMINISTRADOR", "ADMIN")


def _solo_admin(token: dict):
    """Lanza 403 si el usuario no es ADMINISTRADOR."""
    if not _es_admin(token):
        raise HTTPException(status_code=403, detail="Solo ADMINISTRADOR puede gestionar permisos")


# ── Catálogo: submódulos disponibles ─────────────
@router.get("/permisos/submodulos")
def listar_submodulos(db: Session = Depends(get_db), _: dict = Depends(verificar_token)):
    """Todos los submódulos registrados en permiso_accs."""
    return PermisoService(db).obtener_submodulos()


# ── Roles con sus permisos asignados ─────────────
@router.get("/permisos/roles")
def listar_roles_permisos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Todos los roles con sus submódulos asignados + catálogo."""
    _solo_admin(token)
    return PermisoService(db).obtener_roles_con_permisos()


# ── Actualizar permisos de un rol ────────────────
class RolPermisosUpdateSchema(BaseModel):
    permisos: List[int]


@router.put("/permisos/roles/{id_rol}")
def actualizar_permisos_rol(
    id_rol: int,
    datos: RolPermisosUpdateSchema,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    _solo_admin(token)
    try:
        return PermisoService(db).actualizar_permisos_rol(id_rol, datos.permisos)
    except ValueError as e:
        status = 404 if "no encontrado" in str(e) else 500
        raise HTTPException(status_code=status, detail=str(e))


# ── Personal con permisos derivados (lectura) ────
@router.get("/permisos/usuarios")
def listar_usuarios_permisos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Personal de la empresa con permisos derivados del rol (solo lectura)."""
    _solo_admin(token)
    id_empresa = token.get("id_emp")
    return PermisoService(db).listar_personal_empresa(id_empresa)


# ── Cambiar rol de un usuario individual ──────────
class CambioRolSchema(BaseModel):
    id_rol: int


@router.put("/permisos/usuarios/{id_accs}/rol")
def cambiar_rol_usuario(
    id_accs: int,
    datos: CambioRolSchema,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cambia el rol de un usuario específico (personaliza su acceso)."""
    _solo_admin(token)
    try:
        return PermisoService(db).cambiar_rol_usuario(id_accs, datos.id_rol)
    except ValueError as e:
        status = 404 if "no encontrado" in str(e) else 500
        raise HTTPException(status_code=status, detail=str(e))


# ── Mis módulos (para Sidebar del usuario actual) ─
@router.get("/permisos/mis-modulos")
def mis_modulos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """DESCRIP de submódulos del rol del usuario actual."""
    id_accs = token.get("id_accs")
    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    if not acceso:
        return []
    return PermisoService(db).obtener_modulos_rol(acceso.ID_ROL)
