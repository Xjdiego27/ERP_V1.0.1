# ============================================
# RUTAS DASHBOARD — Panel de inicio del usuario
# Equipos y teléfonos asignados (sin precios)
# ============================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import (
    get_db, Personal, Equipo, TipoEquipo, Marca, Modelo,
    EspecificacionesTec, AsignacionEquipo,
    Chips, OperadorChips, PlanChips, AsignacionChip
)
from auth_token import verificar_token

router = APIRouter()


@router.get("/dashboard/mi-panel")
def mi_panel(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Retorna equipos y líneas telefónicas asignados al usuario actual.
    NO incluye precios ni costos — solo datos descriptivos."""

    id_personal = token.get("id_personal")
    if not id_personal:
        return {"equipos": [], "telefonos": []}

    # ── Equipos asignados (asignación activa = sin fecha devolución) ──
    equipos = []
    if AsignacionEquipo and Equipo:
        asigs = db.query(AsignacionEquipo).filter(
            AsignacionEquipo.ID_PERSONAL == id_personal,
            AsignacionEquipo.FECHA_DEVOL == None
        ).all()

        if asigs:
            eq_ids = [a.ID_EQUIPO for a in asigs]
            equipos_db = {e.ID_EQUIPO: e for e in db.query(Equipo).filter(Equipo.ID_EQUIPO.in_(eq_ids)).all()}

            # Precargar catálogos
            tipos_map = {}
            if TipoEquipo:
                tipos_map = {t.ID_TEQUIPO: t.DESCRIP for t in db.query(TipoEquipo).all()}

            marcas_map = {}
            if Marca:
                marcas_map = {m.ID_MARCA: m.DESCRIP for m in db.query(Marca).all()}

            modelos_map = {}
            if Modelo:
                modelos_map = {m.ID_MODELO: m.DESCRIP for m in db.query(Modelo).all()}

            for a in asigs:
                eq = equipos_db.get(a.ID_EQUIPO)
                if not eq:
                    continue

                tipo_nombre = tipos_map.get(eq.ID_TEQUIPO, '')
                marca_nombre = ''
                modelo_nombre = ''

                if EspecificacionesTec and eq.ID_ESPEC:
                    espec = db.query(EspecificacionesTec).filter(
                        EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC
                    ).first()
                    if espec:
                        marca_nombre = marcas_map.get(espec.ID_MARCA, '')
                        modelo_nombre = modelos_map.get(espec.ID_MODELO, '')

                equipos.append({
                    "id_equipo": eq.ID_EQUIPO,
                    "serie": eq.SERIE_EQUIPO,
                    "tipo": tipo_nombre,
                    "marca": marca_nombre,
                    "modelo": modelo_nombre,
                    "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
                })

    # ── Líneas telefónicas asignadas (sin precios) ──
    telefonos = []
    if AsignacionChip and Chips:
        asigs_chip = db.query(AsignacionChip).filter(
            AsignacionChip.ID_PERSONAL == id_personal,
            AsignacionChip.FECHA_DEVOL == None
        ).all()

        if asigs_chip:
            chip_ids = [a.ID_CHIPS for a in asigs_chip]
            chips_db = {c.ID_CHIPS: c for c in db.query(Chips).filter(Chips.ID_CHIPS.in_(chip_ids)).all()}

            ops_map = {}
            if OperadorChips:
                ops_map = {o.ID_OPERADOR: o.DESCRIP for o in db.query(OperadorChips).all()}

            planes_map = {}
            if PlanChips:
                planes_map = {p.ID_PLAN: p.DESCRIP for p in db.query(PlanChips).all()}

            for a in asigs_chip:
                chip = chips_db.get(a.ID_CHIPS)
                if not chip:
                    continue
                telefonos.append({
                    "id_chip": chip.ID_CHIPS,
                    "numero": chip.NUMERO,
                    "operador": ops_map.get(chip.ID_OPERADOR, ''),
                    "plan": planes_map.get(chip.ID_PLAN, ''),
                    "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
                })

    return {"equipos": equipos, "telefonos": telefonos}
