# rutas_licencias.py
# CRUD para el módulo de Licencias de software
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Licencia, AsignacionLicencia, Equipo, TipoEquipo
from auth_token import verificar_token

router = APIRouter()


# ═══════════════════════════════════════════
#  LISTAR LICENCIAS CON CONTEO DE ASIGNACIONES
# ═══════════════════════════════════════════
@router.get("/licencias")
def listar_licencias(db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Retorna todas las licencias con cantidad total, asignadas y disponibles."""
    if not Licencia:
        return []

    licencias = db.query(Licencia).all()

    # Precargar asignaciones agrupadas por licencia
    asig_map = {}
    if AsignacionLicencia:
        for a in db.query(AsignacionLicencia).all():
            asig_map.setdefault(a.ID_LICENCIA, []).append(a)

    # Precargar equipos para mostrar info de cada asignación
    equipo_map = {}
    tipo_map = {}
    if Equipo:
        for eq in db.query(Equipo).all():
            equipo_map[eq.ID_EQUIPO] = eq
    if TipoEquipo:
        for t in db.query(TipoEquipo).all():
            tipo_map[t.ID_TEQUIPO] = t.DESCRIP

    resultado = []
    for lic in licencias:
        asignaciones_lic = asig_map.get(lic.ID_LICENCIA, [])
        asignadas = len(asignaciones_lic)
        disponibles = max(0, lic.CANTIDAD - asignadas)

        # Detalle de equipos asignados
        equipos_asignados = []
        for a in asignaciones_lic:
            eq = equipo_map.get(a.ID_EQUIPO)
            if eq:
                equipos_asignados.append({
                    "id_asiglicenc": a.ID_ASIGLICENC,
                    "id_equipo": eq.ID_EQUIPO,
                    "serie": eq.SERIE_EQUIPO,
                    "tipo": tipo_map.get(eq.ID_TEQUIPO, ''),
                })

        resultado.append({
            "id_licencia": lic.ID_LICENCIA,
            "descripcion": lic.DESCRIP,
            "cantidad": lic.CANTIDAD,
            "serie_keys": lic.SERIE_KEYS,
            "asignadas": asignadas,
            "disponibles": disponibles,
            "equipos": equipos_asignados,
        })

    return resultado


# ═══════════════════════════════════════════
#  LICENCIAS DISPONIBLES (para select en equipos)
# ═══════════════════════════════════════════
@router.get("/licencias/disponibles")
def licencias_disponibles(db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Retorna solo licencias que aún tienen stock disponible (para dropdowns)."""
    if not Licencia:
        return []

    licencias = db.query(Licencia).all()

    asig_count = {}
    if AsignacionLicencia:
        for a in db.query(AsignacionLicencia).all():
            asig_count[a.ID_LICENCIA] = asig_count.get(a.ID_LICENCIA, 0) + 1

    resultado = []
    for lic in licencias:
        usadas = asig_count.get(lic.ID_LICENCIA, 0)
        disponibles = max(0, lic.CANTIDAD - usadas)
        resultado.append({
            "id_licencia": lic.ID_LICENCIA,
            "descripcion": lic.DESCRIP,
            "serie_keys": lic.SERIE_KEYS,
            "cantidad": lic.CANTIDAD,
            "disponibles": disponibles,
        })

    return resultado


# ═══════════════════════════════════════════
#  CREAR LICENCIA
# ═══════════════════════════════════════════
@router.post("/licencias")
def crear_licencia(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Licencia:
        raise HTTPException(status_code=500, detail="Tabla licencia no disponible")

    descrip = (datos.get("descripcion") or "").strip()
    serie_keys = (datos.get("serie_keys") or "").strip()
    cantidad = datos.get("cantidad", 1)

    if not descrip:
        raise HTTPException(status_code=400, detail="La descripción es obligatoria")
    if not serie_keys:
        raise HTTPException(status_code=400, detail="El serial/key es obligatorio")
    if not isinstance(cantidad, int) or cantidad < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")

    lic = Licencia()
    lic.DESCRIP = descrip.upper()
    lic.CANTIDAD = cantidad
    lic.SERIE_KEYS = serie_keys

    try:
        db.add(lic)
        db.commit()
        db.refresh(lic)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear licencia: {str(e)}")

    return {"id_licencia": lic.ID_LICENCIA, "mensaje": "Licencia creada correctamente"}


# ═══════════════════════════════════════════
#  EDITAR LICENCIA
# ═══════════════════════════════════════════
@router.put("/licencias/{id_licencia}")
def editar_licencia(id_licencia: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Licencia:
        raise HTTPException(status_code=500, detail="Tabla licencia no disponible")

    lic = db.query(Licencia).filter(Licencia.ID_LICENCIA == id_licencia).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")

    descrip = datos.get("descripcion")
    if descrip is not None:
        lic.DESCRIP = descrip.strip().upper()

    serie_keys = datos.get("serie_keys")
    if serie_keys is not None:
        lic.SERIE_KEYS = serie_keys.strip()

    cantidad = datos.get("cantidad")
    if cantidad is not None:
        # No permitir reducir por debajo de asignaciones actuales
        asignadas = 0
        if AsignacionLicencia:
            asignadas = db.query(AsignacionLicencia).filter(
                AsignacionLicencia.ID_LICENCIA == id_licencia
            ).count()
        if int(cantidad) < asignadas:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede reducir a {cantidad}, ya hay {asignadas} asignadas"
            )
        lic.CANTIDAD = int(cantidad)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar: {str(e)}")

    return {"mensaje": "Licencia actualizada correctamente"}


# ═══════════════════════════════════════════
#  ELIMINAR LICENCIA
# ═══════════════════════════════════════════
@router.delete("/licencias/{id_licencia}")
def eliminar_licencia(id_licencia: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Licencia:
        raise HTTPException(status_code=500, detail="Tabla licencia no disponible")

    lic = db.query(Licencia).filter(Licencia.ID_LICENCIA == id_licencia).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")

    # No eliminar si tiene asignaciones
    if AsignacionLicencia:
        count = db.query(AsignacionLicencia).filter(
            AsignacionLicencia.ID_LICENCIA == id_licencia
        ).count()
        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: hay {count} equipo(s) con esta licencia asignada"
            )

    try:
        db.delete(lic)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al eliminar: {str(e)}")

    return {"mensaje": "Licencia eliminada correctamente"}


# ═══════════════════════════════════════════
#  ASIGNAR LICENCIA A EQUIPO
# ═══════════════════════════════════════════
@router.post("/licencias/asignar")
def asignar_licencia(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Licencia or not AsignacionLicencia:
        raise HTTPException(status_code=500, detail="Tablas no disponibles")

    id_licencia = datos.get("id_licencia")
    id_equipo = datos.get("id_equipo")

    if not id_licencia or not id_equipo:
        raise HTTPException(status_code=400, detail="Licencia y equipo son requeridos")

    # Verificar que la licencia existe y tiene disponibilidad
    lic = db.query(Licencia).filter(Licencia.ID_LICENCIA == id_licencia).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")

    asignadas = db.query(AsignacionLicencia).filter(
        AsignacionLicencia.ID_LICENCIA == id_licencia
    ).count()
    if asignadas >= lic.CANTIDAD:
        raise HTTPException(status_code=400, detail="No hay licencias disponibles para asignar")

    # Verificar que el equipo no tenga ya esta licencia
    ya_asignada = db.query(AsignacionLicencia).filter(
        AsignacionLicencia.ID_EQUIPO == id_equipo,
        AsignacionLicencia.ID_LICENCIA == id_licencia
    ).first()
    if ya_asignada:
        raise HTTPException(status_code=400, detail="Esta licencia ya está asignada a este equipo")

    asig = AsignacionLicencia()
    asig.ID_EQUIPO = id_equipo
    asig.ID_LICENCIA = id_licencia

    try:
        db.add(asig)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al asignar: {str(e)}")

    return {"mensaje": "Licencia asignada correctamente"}


# ═══════════════════════════════════════════
#  DESASIGNAR LICENCIA DE EQUIPO
# ═══════════════════════════════════════════
@router.delete("/licencias/asignar/{id_asiglicenc}")
def desasignar_licencia(id_asiglicenc: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not AsignacionLicencia:
        raise HTTPException(status_code=500, detail="Tabla no disponible")

    asig = db.query(AsignacionLicencia).filter(
        AsignacionLicencia.ID_ASIGLICENC == id_asiglicenc
    ).first()
    if not asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    try:
        db.delete(asig)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al desasignar: {str(e)}")

    return {"mensaje": "Licencia desasignada correctamente"}
