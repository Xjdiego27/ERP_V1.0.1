# ============================================
# RUTAS DASHBOARD — Panel de inicio del usuario
# Equipos, chips, licencias, asistencia y tickets
# ============================================

from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import (
    get_db, Personal, Equipo, TipoEquipo, Marca, Modelo,
    EspecificacionesTec, AsignacionEquipo,
    Procesador, TipoRam, Ram, Gama, Almacenamiento,
    TipoDisco, CapacidadDisco, Disco,
    Chips, OperadorChips, PlanChips, AsignacionChip,
    Licencia, AsignacionLicencia,
    Ticket, CategoriaTicket,
    Contrato, CatgAsistencia, HorarioDetalle, Acceso
)
from auth_token import verificar_token
from mongodb import coleccion_asistencia, coleccion_justificaciones
from rutas_asistencia import (
    _horario_del_empleado, _mapa_categorias,
    _marcajes_mongo_por_dni, _justificaciones_mongo,
    _procesar_dias_nosql, _rango_fechas
)

router = APIRouter()


@router.get("/dashboard/mi-panel")
async def mi_panel(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Panel de inicio: equipos, chips, licencias, asistencia del mes y tickets activos."""

    id_personal = token.get("id_personal")
    if not id_personal:
        return {"equipos": [], "telefonos": [], "licencias": [], "asistencia": [], "tickets": []}

    personal = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()

    # ── Equipos asignados ──
    equipos = []
    eq_ids_asignados = []
    if AsignacionEquipo and Equipo:
        asigs = db.query(AsignacionEquipo).filter(
            AsignacionEquipo.ID_PERSONAL == id_personal,
            AsignacionEquipo.FECHA_DEVOL == None
        ).all()

        if asigs:
            eq_ids_asignados = [a.ID_EQUIPO for a in asigs]
            equipos_db = {e.ID_EQUIPO: e for e in db.query(Equipo).filter(Equipo.ID_EQUIPO.in_(eq_ids_asignados)).all()}

            tipos_map = {t.ID_TEQUIPO: t.DESCRIP for t in db.query(TipoEquipo).all()} if TipoEquipo else {}
            marcas_map = {m.ID_MARCA: m.DESCRIP for m in db.query(Marca).all()} if Marca else {}
            modelos_map = {m.ID_MODELO: m.DESCRIP for m in db.query(Modelo).all()} if Modelo else {}
            procs_map = {p.ID_PROCESADOR: p.DESCRIP for p in db.query(Procesador).all()} if Procesador else {}
            trams_map = {t.ID_TIPO_RAM: t.DESCRIP for t in db.query(TipoRam).all()} if TipoRam else {}
            rams_map = {r.ID_RAM: r.DESCRIP for r in db.query(Ram).all()} if Ram else {}
            gamas_map = {g.ID_GAMA: g.DESCRIP for g in db.query(Gama).all()} if Gama else {}

            # Mapa de discos: id_disco → (tipo_disco, capacidad)
            tdiscos_map = {t.ID_TDISCO: t.DESCRIP for t in db.query(TipoDisco).all()} if TipoDisco else {}
            capdiscos_map = {c.ID_CAPDISCO: c.DESCRIP for c in db.query(CapacidadDisco).all()} if CapacidadDisco else {}
            discos_map = {}
            if Disco:
                for d in db.query(Disco).all():
                    discos_map[d.ID_DISCO] = (d.ID_TDISCO, d.ID_CAPDISCO)

            # Almacenamiento por equipo
            almc_map = {}
            if Almacenamiento:
                for a in db.query(Almacenamiento).filter(Almacenamiento.ID_EQUIPO.in_(eq_ids_asignados)).all():
                    almc_map.setdefault(a.ID_EQUIPO, []).append(a)

            for a in asigs:
                eq = equipos_db.get(a.ID_EQUIPO)
                if not eq:
                    continue
                tipo_nombre = tipos_map.get(eq.ID_TEQUIPO, '')
                marca_nombre = ''
                modelo_nombre = ''
                procesador = ''
                tipo_ram = ''
                ram = ''
                gama = ''
                codigoe = ''
                if EspecificacionesTec and eq.ID_ESPEC:
                    espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC).first()
                    if espec:
                        marca_nombre = marcas_map.get(espec.ID_MARCA, '')
                        modelo_nombre = modelos_map.get(espec.ID_MODELO, '')
                        procesador = procs_map.get(espec.ID_PROCESADOR, '')
                        tipo_ram = trams_map.get(getattr(espec, 'ID_TIPO_RAM', None), '')
                        ram = rams_map.get(espec.ID_RAM, '')
                        gama = gamas_map.get(espec.ID_GAMA, '')
                        codigoe = espec.CODIGOE or ''

                # Almacenamiento
                almacenes = []
                for almc in almc_map.get(eq.ID_EQUIPO, []):
                    disco_info = discos_map.get(almc.ID_DISCO)
                    td = tdiscos_map.get(disco_info[0], '') if disco_info else ''
                    cd = capdiscos_map.get(disco_info[1], '') if disco_info else ''
                    almacenes.append(f"{td} {cd}".strip())

                equipos.append({
                    "id_equipo": eq.ID_EQUIPO,
                    "serie": eq.SERIE_EQUIPO,
                    "tipo": tipo_nombre,
                    "marca": marca_nombre,
                    "modelo": modelo_nombre,
                    "procesador": procesador,
                    "tipo_ram": tipo_ram,
                    "ram": ram,
                    "gama": gama,
                    "codigoe": codigoe,
                    "almacenamiento": almacenes,
                    "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
                })

    # ── Líneas telefónicas ──
    telefonos = []
    if AsignacionChip and Chips:
        asigs_chip = db.query(AsignacionChip).filter(
            AsignacionChip.ID_PERSONAL == id_personal,
            AsignacionChip.FECHA_DEVOL == None
        ).all()
        if asigs_chip:
            chip_ids = [a.ID_CHIPS for a in asigs_chip]
            chips_db = {c.ID_CHIPS: c for c in db.query(Chips).filter(Chips.ID_CHIPS.in_(chip_ids)).all()}
            ops_map = {o.ID_OPERADOR: o.DESCRIP for o in db.query(OperadorChips).all()} if OperadorChips else {}
            planes_map = {p.ID_PLAN: p.DESCRIP for p in db.query(PlanChips).all()} if PlanChips else {}
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

    # ── Licencias (a través de equipos asignados) ──
    licencias = []
    if eq_ids_asignados and AsignacionLicencia and Licencia:
        asigs_lic = db.query(AsignacionLicencia).filter(
            AsignacionLicencia.ID_EQUIPO.in_(eq_ids_asignados)
        ).all()
        if asigs_lic:
            lic_ids = list(set(al.ID_LICENCIA for al in asigs_lic))
            lics_db = {l.ID_LICENCIA: l for l in db.query(Licencia).filter(Licencia.ID_LICENCIA.in_(lic_ids)).all()}
            for al in asigs_lic:
                lic = lics_db.get(al.ID_LICENCIA)
                if lic:
                    licencias.append({
                        "id": lic.ID_LICENCIA,
                        "nombre": lic.DESCRIP,
                        "serie": lic.SERIE_KEYS,
                    })

    # ── Asistencia del mes actual ──
    asistencia_dias = []
    resumen_asist = {}
    try:
        if personal:
            hoy = date.today()
            fi = date(hoy.year, hoy.month, 1)
            ff = date(hoy.year, hoy.month + 1, 1) - timedelta(days=1) if hoy.month < 12 else date(hoy.year, 12, 31)
            contrato = db.query(Contrato).filter(Contrato.ID_PERSONAL == id_personal, Contrato.ID_ESTADO_CONTRATO == 1).first() if Contrato else None
            horario_dias = _horario_del_empleado(db, personal, contrato)
            categorias = _mapa_categorias(db)
            dni = getattr(personal, 'NUM_DOC', None)
            marcajes = await _marcajes_mongo_por_dni(dni, fi, ff) if dni else {}
            justifs = await _justificaciones_mongo(id_personal, fi, ff)
            asistencia_dias, resumen_asist = _procesar_dias_nosql(fi, ff, marcajes, justifs, horario_dias, categorias)
    except Exception as e:
        print(f"[WARN] Error obteniendo asistencia dashboard: {e}")

    # ── Tickets activos ──
    tickets = []
    try:
        if Ticket and personal:
            cat_map = {}
            if CategoriaTicket:
                cat_map = {c.ID_CATEGORIA: c.DESCRIP for c in db.query(CategoriaTicket).all()}
            tks = db.query(Ticket).filter(
                Ticket.ID_PERSONAL == id_personal,
                Ticket.ESTADO.in_(["ABIERTO", "ASIGNADO"])
            ).order_by(Ticket.FECH_CREACION.desc()).limit(10).all()
            for t in tks:
                tickets.append({
                    "id_ticket": t.ID_TICKET,
                    "asunto": t.ASUNTO,
                    "estado": t.ESTADO,
                    "prioridad": t.PRIORIDAD,
                    "categoria": cat_map.get(t.ID_CATEGORIA, ''),
                    "fecha": str(t.FECH_CREACION) if t.FECH_CREACION else None,
                })
    except Exception as e:
        print(f"[WARN] Error obteniendo tickets dashboard: {e}")

    return {
        "equipos": equipos,
        "telefonos": telefonos,
        "licencias": licencias,
        "asistencia": asistencia_dias,
        "resumen_asistencia": resumen_asist,
        "tickets": tickets,
    }
