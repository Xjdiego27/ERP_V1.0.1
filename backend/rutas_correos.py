# rutas_correos.py
# CRUD para correos corporativos — tabla correo_coorp
# Contraseñas almacenadas con AES_ENCRYPT en MySQL
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db, Personal, Acceso, Contrato, Cargo, Area, settings
from auth_token import verificar_token

router = APIRouter()

# ── Clave AES — se lee de settings (.env) ──
AES_KEY = getattr(settings, 'aes_key', '')


# ═══════════════════════════════════════════
#  SCHEMAS
# ═══════════════════════════════════════════
class CorreoCreate(BaseModel):
    id_personal: int
    correo: str
    password: str


class CorreoUpdate(BaseModel):
    correo: Optional[str] = None
    password: Optional[str] = None


# ═══════════════════════════════════════════
#  LISTAR PERSONAL CON SUS CORREOS
# ═══════════════════════════════════════════
@router.get("/correos")
def listar_correos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista todo el personal activo de la empresa con sus correos corporativos."""
    id_empresa = token.get("id_emp")

    # Personal activo de la empresa
    filas = (
        db.query(Personal, Contrato, Cargo)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(
            Cargo.ID_EMP == id_empresa,
            Contrato.ID_ESTADO_CONTRATO == 1,
            Acceso.ID_ESTADO == 1,
        )
        .all()
    )

    # Mapa de áreas
    areas_map = {}
    try:
        for a in db.query(Area).all():
            areas_map[a.ID_AREA] = a.DESCRIP
    except Exception:
        pass

    # IDs de personal
    ids_personal = list(set(p.ID_PERSONAL for p, _, _ in filas))
    if not ids_personal:
        return []

    # Correos corporativos (SIN contraseña — se descifra bajo demanda)
    correos_rows = db.execute(
        text("""
            SELECT ID_CORREO, ID_PERSONAL, CORREO_COORP
            FROM correo_coorp
            WHERE ID_PERSONAL IN :ids
            ORDER BY ID_CORREO
        """),
        {"ids": tuple(ids_personal)}
    ).fetchall()

    # Agrupar correos por personal
    correos_map = {}
    for row in correos_rows:
        pid = row[1]
        if pid not in correos_map:
            correos_map[pid] = []
        correos_map[pid].append({
            "id_correo": row[0],
            "correo": row[2],
        })

    # Construir resultado — evitar duplicados
    vistos = set()
    resultado = []
    for p, contrato, cargo in filas:
        if p.ID_PERSONAL in vistos:
            continue
        vistos.add(p.ID_PERSONAL)
        resultado.append({
            "id_personal": p.ID_PERSONAL,
            "nombre_completo": f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}",
            "foto": p.FOTO,
            "area": areas_map.get(contrato.ID_AREA, "—") if contrato else "—",
            "cargo": cargo.DESCRIP if cargo else "—",
            "correos": correos_map.get(p.ID_PERSONAL, []),
        })

    resultado.sort(key=lambda x: x["nombre_completo"])
    return resultado


# ═══════════════════════════════════════════
#  VER CONTRASEÑA (descifrar con clave AES)
# ═══════════════════════════════════════════
class VerPasswordRequest(BaseModel):
    clave_aes: str


@router.post("/correos/{id_correo}/ver-password")
def ver_password(id_correo: int, datos: VerPasswordRequest, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Descifra la contraseña de un correo usando la clave AES proporcionada por el usuario."""
    row = db.execute(
        text("""
            SELECT CAST(AES_DECRYPT(PASS_COORP, :key) AS CHAR) AS pass_texto
            FROM correo_coorp
            WHERE ID_CORREO = :id
        """),
        {"key": datos.clave_aes, "id": id_correo}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Correo no encontrado")
    password = row[0]
    if not password:
        raise HTTPException(status_code=403, detail="Clave AES incorrecta")
    return {"ok": True, "password": password}


# ═══════════════════════════════════════════
#  AGREGAR CORREO
# ═══════════════════════════════════════════
@router.post("/correos")
def agregar_correo(datos: CorreoCreate, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Agrega un nuevo correo corporativo a un personal."""
    db.execute(
        text("""
            INSERT INTO correo_coorp (ID_PERSONAL, CORREO_COORP, PASS_COORP)
            VALUES (:id_personal, :correo, AES_ENCRYPT(:password, :key))
        """),
        {
            "id_personal": datos.id_personal,
            "correo": datos.correo,
            "password": datos.password,
            "key": AES_KEY,
        }
    )
    db.commit()
    return {"ok": True, "mensaje": "Correo agregado correctamente"}


# ═══════════════════════════════════════════
#  ACTUALIZAR CORREO
# ═══════════════════════════════════════════
@router.put("/correos/{id_correo}")
def actualizar_correo(id_correo: int, datos: CorreoUpdate, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Actualiza correo y/o contraseña de un registro."""
    # Verificar que existe
    existe = db.execute(
        text("SELECT ID_CORREO FROM correo_coorp WHERE ID_CORREO = :id"),
        {"id": id_correo}
    ).fetchone()
    if not existe:
        raise HTTPException(status_code=404, detail="Correo no encontrado")

    if datos.correo is not None:
        db.execute(
            text("UPDATE correo_coorp SET CORREO_COORP = :correo WHERE ID_CORREO = :id"),
            {"correo": datos.correo, "id": id_correo}
        )

    if datos.password is not None:
        db.execute(
            text("UPDATE correo_coorp SET PASS_COORP = AES_ENCRYPT(:password, :key) WHERE ID_CORREO = :id"),
            {"password": datos.password, "key": AES_KEY, "id": id_correo}
        )

    db.commit()
    return {"ok": True, "mensaje": "Correo actualizado correctamente"}


# ═══════════════════════════════════════════
#  ELIMINAR CORREO
# ═══════════════════════════════════════════
@router.delete("/correos/{id_correo}")
def eliminar_correo(id_correo: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Elimina un correo corporativo."""
    existe = db.execute(
        text("SELECT ID_CORREO FROM correo_coorp WHERE ID_CORREO = :id"),
        {"id": id_correo}
    ).fetchone()
    if not existe:
        raise HTTPException(status_code=404, detail="Correo no encontrado")

    db.execute(
        text("DELETE FROM correo_coorp WHERE ID_CORREO = :id"),
        {"id": id_correo}
    )
    db.commit()
    return {"ok": True, "mensaje": "Correo eliminado correctamente"}
