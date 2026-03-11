from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional
from collections import defaultdict
from database import (
    get_db,
    Personal, Area, Acceso, Contrato, Cargo, Departamento,
    Horario, HorarioDetalle,
    CatgAsistencia
)
from helpers import construir_rangos_horarios
from mongodb import coleccion_asistencia, coleccion_justificaciones
from auth_token import verificar_token
from auditoria import registrar_accion

router = APIRouter()

DIAS_EN_ES = {
    0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves',
    4: 'viernes', 5: 'sabado', 6: 'domingo',
}

DIA_BD_A_WEEKDAY = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6}


# ─── HELPERS (MySQL) ──────────────────────────────

def _horario_del_empleado(db: Session, personal, contrato=None) -> dict:
    """Obtiene el horario semanal de un empleado. Retorna {} si no hay."""
    if not HorarioDetalle:
        return {}
    id_horario = (getattr(contrato, 'ID_HORARIO', None) or 1) if contrato else 1
    resultado = {}
    try:
        for dh in db.query(HorarioDetalle).filter(HorarioDetalle.ID_HORARIO == id_horario).all():
            wd = DIA_BD_A_WEEKDAY.get(dh.DIA)
            if wd is not None:
                resultado[wd] = {
                    "hora_e": str(dh.HORA_E) if dh.HORA_E else None,
                    "hora_s": str(dh.HORA_S) if dh.HORA_S else None,
                    "descanso": bool(getattr(dh, 'DIA_DESC', 0))
                }
    except Exception as e:
        print(f"⚠️ Error obteniendo horario: {e}")
    return resultado


def _mapa_categorias(db: Session) -> dict:
    """Retorna {ID_CATGA: DESCRIP}."""
    if not CatgAsistencia:
        return {}
    try:
        return {c.ID_CATGA: c.DESCRIP for c in db.query(CatgAsistencia).all()}
    except:
        return {}


def _calcular_tardanza(hora_real: str, hora_prog: str) -> int:
    """Minutos de tardanza. 0 si no hay o llego a tiempo."""
    if not hora_real or not hora_prog:
        return 0
    try:
        t_real = datetime.strptime(hora_real.strip(), "%H:%M:%S")
        t_prog = datetime.strptime(hora_prog.strip(), "%H:%M:%S")
        if t_real <= t_prog:
            return 0
        return int((t_real - t_prog).total_seconds() / 60)
    except:
        return 0


def _rango_fechas(fecha_inicio, fecha_fin, mes, anio):
    """Determina (fi, ff) a partir de los query params."""
    hoy = date.today()
    if fecha_inicio and fecha_fin:
        return date.fromisoformat(fecha_inicio), date.fromisoformat(fecha_fin)
    if mes and anio:
        fi = date(anio, mes, 1)
        ff = date(anio, mes + 1, 1) - timedelta(days=1) if mes < 12 else date(anio, 12, 31)
        return fi, ff
    fi = date(hoy.year, hoy.month, 1)
    ff = date(hoy.year, hoy.month + 1, 1) - timedelta(days=1) if hoy.month < 12 else date(hoy.year, 12, 31)
    return fi, ff


def _deduplicar_marcajes(horas_sorted, umbral_min=3):
    """Elimina marcajes duplicados (ej: doble fichaje en 1 seg).
    Agrupa marcajes que estén a menos de `umbral_min` minutos entre sí
    y retorna solo el primero de cada grupo.
    Ejemplo: ['08:15:33','08:15:34','17:30:00'] → ['08:15:33','17:30:00']
    """
    if not horas_sorted:
        return []
    resultado = [horas_sorted[0]]
    for hora in horas_sorted[1:]:
        try:
            t_prev = datetime.strptime(resultado[-1], "%H:%M:%S")
            t_curr = datetime.strptime(hora, "%H:%M:%S")
            diff = abs((t_curr - t_prev).total_seconds()) / 60
            if diff >= umbral_min:
                resultado.append(hora)
        except Exception:
            resultado.append(hora)
    return resultado


# ─── HELPERS ASYNC (MongoDB) ─────────────────────

async def _marcajes_mongo_por_dni(dni, fi, ff):
    """Obtiene marcajes crudos de MongoDB agrupados por dia.
    Retorna dict: { "2026-02-24": ["08:15:33", "17:30:00"], ... }
    """
    dni_str = str(dni).strip()
    try:
        dni_int = int(dni_str)
        filtro = {"emp_pin": {"$in": [dni_int, dni_str]}}
    except ValueError:
        filtro = {"emp_pin": dni_str}

    filtro["dia"] = {"$gte": str(fi), "$lte": str(ff)}

    cursor = coleccion_asistencia.find(filtro, {"dia": 1, "hora": 1, "_id": 0})
    marcajes = await cursor.to_list(length=None)

    por_dia = defaultdict(list)
    for m in marcajes:
        if m.get("dia") and m.get("hora"):
            por_dia[m["dia"]].append(m["hora"])
    return dict(por_dia)


async def _marcajes_mongo_todos(fi, ff):
    """Obtiene TODOS los marcajes de MongoDB en un rango (batch).
    Retorna dict: { "12345678": { "2026-02-24": ["08:15", "17:30"], ... }, ... }
    """
    filtro = {"dia": {"$gte": str(fi), "$lte": str(ff)}}
    cursor = coleccion_asistencia.find(filtro, {"emp_pin": 1, "dia": 1, "hora": 1, "_id": 0})
    marcajes = await cursor.to_list(length=None)

    por_pin = defaultdict(lambda: defaultdict(list))
    for m in marcajes:
        pin = str(m.get("emp_pin", "")).strip()
        if pin and m.get("dia") and m.get("hora"):
            por_pin[pin][m["dia"]].append(m["hora"])
    return por_pin


async def _justificaciones_mongo(id_personal, fi, ff):
    """Obtiene justificaciones de MongoDB para un empleado en un rango.
    Retorna dict: { "2026-02-24": {id_catga, hora_e, hora_s, obsv}, ... }
    """
    filtro = {
        "id_personal": id_personal,
        "fecha": {"$gte": str(fi), "$lte": str(ff)}
    }
    cursor = coleccion_justificaciones.find(filtro, {"_id": 0})
    docs = await cursor.to_list(length=None)
    return {j["fecha"]: j for j in docs}


async def _justificaciones_mongo_todas(fi, ff):
    """Obtiene TODAS las justificaciones en un rango (batch).
    Retorna dict: { id_personal: { "2026-02-24": {...}, ... }, ... }
    """
    filtro = {"fecha": {"$gte": str(fi), "$lte": str(ff)}}
    cursor = coleccion_justificaciones.find(filtro, {"_id": 0})
    docs = await cursor.to_list(length=None)

    por_personal = defaultdict(dict)
    for j in docs:
        por_personal[j["id_personal"]][j["fecha"]] = j
    return por_personal


# ─── PROCESAMIENTO DE DIAS ────────────────────────

def _procesar_dias_nosql(fi, ff, marcajes_por_dia, justif_por_fecha, horario_dias, categorias):
    """Construye la lista de dias combinando marcajes MongoDB + justificaciones + horarios MySQL."""
    hoy = date.today()
    dias = []
    resumen = {"total_asistencias": 0, "total_tardanzas": 0, "total_faltas": 0, "total_min_tardanza": 0}

    d = fi
    while d <= ff:
        dia_str = str(d)
        dia_semana = DIAS_EN_ES.get(d.weekday(), '')
        h_dia = horario_dias.get(d.weekday(), {})
        es_descanso = h_dia.get('descanso', False)
        es_futuro = d > hoy

        # Marcajes crudos del huellero (MongoDB)
        horas = marcajes_por_dia.get(dia_str, [])
        horas_sorted = sorted(horas) if horas else []
        # Filtrar fichajes duplicados (ej: doble marca en 1 seg)
        horas_sorted = _deduplicar_marcajes(horas_sorted)
        hora_e = horas_sorted[0] if horas_sorted else None
        hora_s = horas_sorted[-1] if len(horas_sorted) > 1 else None

        # Justificacion manual (MongoDB)
        justif = justif_por_fecha.get(dia_str)

        if justif:
            # ── Justificacion manual existe → prioridad
            j_catga = justif.get("id_catga")
            cat = categorias.get(j_catga, '')
            j_he = justif.get("hora_e") or hora_e
            j_hs = justif.get("hora_s") or hora_s
            obsv = justif.get("obsv", "")

            tard = 0
            if not es_descanso and j_he and j_he != '00:00:00':
                tard = _calcular_tardanza(j_he, h_dia.get('hora_e'))

            # Si llegó tarde pero la justificación dice PUNTUAL, corregir a TARDANZA
            if tard > 0 and j_catga == 1:
                j_catga = 2
                cat = categorias.get(2, 'TARDANZA')

            es_falta = (not es_descanso and (j_he in (None, '00:00:00')) and j_catga in (None, 2))

            if not es_descanso:
                if es_falta:
                    resumen["total_faltas"] += 1
                else:
                    resumen["total_asistencias"] += 1
                    if tard > 0:
                        resumen["total_tardanzas"] += 1
                        resumen["total_min_tardanza"] += tard

            dias.append({
                "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                "hora_e": j_he, "hora_s": j_hs, "min_tardanza": tard,
                "categoria": cat, "id_catga": j_catga,
                "obsv": obsv, "es_descanso": es_descanso, "es_falta": es_falta,
                "modificado_por": justif.get("modificado_por", "")
            })

        elif horas_sorted:
            # ── Tiene marcajes del huellero
            # Detectar INCONSISTENCIA: solo 1 marcaje y ya pasó la hora de salida
            # Antes de la hora de salida, un solo marcaje de entrada es NORMAL
            # (el trabajador aún está en su jornada laboral)
            tipo_inconsistencia = None  # None | 'solo_salida' | 'solo_entrada'
            if len(horas_sorted) == 1 and not es_descanso:
                hora_prog_e = h_dia.get('hora_e')
                hora_prog_s = h_dia.get('hora_s')
                if hora_prog_e and hora_prog_s and hora_e:
                    try:
                        t_marca = datetime.strptime(hora_e, "%H:%M:%S")
                        t_prog_e = datetime.strptime(hora_prog_e, "%H:%M:%S")
                        t_prog_s = datetime.strptime(hora_prog_s, "%H:%M:%S")
                        medio = t_prog_e + (t_prog_s - t_prog_e) / 2

                        # Solo evaluar inconsistencia si el día ya terminó
                        # (día pasado, o día de hoy pero ya pasó la hora de salida)
                        dia_ya_termino = (d < hoy)
                        if d == hoy:
                            ahora = datetime.now().time()
                            hora_limite = t_prog_s.time()
                            dia_ya_termino = ahora > hora_limite

                        if dia_ya_termino:
                            if t_marca > medio:
                                tipo_inconsistencia = 'solo_salida'
                            else:
                                tipo_inconsistencia = 'solo_entrada'
                        # Si el día NO ha terminado, no marcar inconsistencia
                        # (el trabajador puede estar aún en su turno)
                    except Exception:
                        pass

            if tipo_inconsistencia == 'solo_salida':
                # Solo marcó salida → INCONSISTENCIA (no se puede confirmar entrada)
                resumen["total_faltas"] += 1
                dias.append({
                    "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                    "hora_e": None, "hora_s": hora_e, "min_tardanza": 0,
                    "categoria": categorias.get(13, "INCONSISTENCIA"), "id_catga": 13,
                    "obsv": "Solo marcó salida", "es_descanso": False, "es_falta": False
                })

            elif tipo_inconsistencia == 'solo_entrada':
                # Solo marcó entrada → INCONSISTENCIA (falta salida, día ya cerrado)
                tard = _calcular_tardanza(hora_e, h_dia.get('hora_e'))
                if not es_descanso:
                    resumen["total_asistencias"] += 1
                    if tard > 0:
                        resumen["total_tardanzas"] += 1
                        resumen["total_min_tardanza"] += tard
                dias.append({
                    "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                    "hora_e": hora_e, "hora_s": None, "min_tardanza": tard,
                    "categoria": categorias.get(13, "INCONSISTENCIA"), "id_catga": 13,
                    "obsv": "Solo marcó entrada", "es_descanso": False, "es_falta": False
                })

            else:
                # ≥2 marcajes o descanso → ASISTIO normalmente
                tard = 0
                if not es_descanso and hora_e and hora_e != '00:00:00':
                    tard = _calcular_tardanza(hora_e, h_dia.get('hora_e'))

                # Determinar categoría: TARDANZA (2) si llegó tarde, PUNTUAL (1) si no
                if tard > 0:
                    cat_id = 2
                    cat_nombre = categorias.get(2, "TARDANZA")
                else:
                    cat_id = 1
                    cat_nombre = categorias.get(1, "PUNTUAL")

                if not es_descanso:
                    resumen["total_asistencias"] += 1
                    if tard > 0:
                        resumen["total_tardanzas"] += 1
                        resumen["total_min_tardanza"] += tard

                dias.append({
                    "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                    "hora_e": hora_e, "hora_s": hora_s, "min_tardanza": tard,
                    "categoria": cat_nombre, "id_catga": cat_id,
                    "obsv": "", "es_descanso": es_descanso, "es_falta": False
                })

        elif es_descanso:
            dias.append({
                "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                "hora_e": None, "hora_s": None, "min_tardanza": 0,
                "categoria": "DESCANSO", "id_catga": 11, "obsv": "",
                "es_descanso": True, "es_falta": False
            })

        elif es_futuro:
            dias.append({
                "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                "hora_e": None, "hora_s": None, "min_tardanza": 0,
                "categoria": "", "id_catga": None, "obsv": "",
                "es_descanso": False, "es_falta": False
            })

        else:
            # ── Sin marcajes ni justificacion → FALTA
            resumen["total_faltas"] += 1
            dias.append({
                "id": None, "fecha": dia_str, "dia": dia_semana.capitalize(),
                "hora_e": None, "hora_s": None, "min_tardanza": 0,
                "categoria": "AUSENTISMO", "id_catga": 2, "obsv": "",
                "es_descanso": False, "es_falta": True
            })

        d += timedelta(days=1)

    return dias, resumen


# ═══════════════════════════════════════════════════
#  ASISTENCIAS de un empleado (datos de MongoDB)
# ═══════════════════════════════════════════════════
@router.get("/asistencia/personal/{id_personal}")
async def obtener_asistencia_personal(
    id_personal: int,
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    mes: Optional[int] = Query(None),
    anio: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    personal = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    contrato = db.query(Contrato).filter(Contrato.ID_PERSONAL == id_personal, Contrato.ID_ESTADO_CONTRATO == 1).first() if Contrato else None

    fi, ff = _rango_fechas(fecha_inicio, fecha_fin, mes, anio)
    horario_dias = _horario_del_empleado(db, personal, contrato)
    categorias = _mapa_categorias(db)

    dni = getattr(personal, 'NUM_DOC', None)
    marcajes_por_dia = await _marcajes_mongo_por_dni(dni, fi, ff) if dni else {}
    justif_por_fecha = await _justificaciones_mongo(id_personal, fi, ff)

    dias, resumen = _procesar_dias_nosql(fi, ff, marcajes_por_dia, justif_por_fecha, horario_dias, categorias)

    # Horario legible para el frontend
    horario_front = {}
    for wd, info in horario_dias.items():
        horario_front[DIAS_EN_ES.get(wd, str(wd))] = info

    return {
        "asistencias": dias,
        "resumen": resumen,
        "rango": {"inicio": str(fi), "fin": str(ff)},
        "horario": horario_front
    }


# ═══════════════════════════════════════════════════
#  MARCAJES crudos del huellero (MongoDB, por DNI)
# ═══════════════════════════════════════════════════
@router.get("/asistencia/marcajes/{id_personal}")
async def obtener_marcajes_huellero(
    id_personal: int,
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    personal = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    dni = getattr(personal, 'NUM_DOC', None)
    if not dni:
        return {"marcajes": [], "mensaje": "Empleado sin DNI registrado"}

    # Construir filtro MongoDB (emp_pin puede ser int o str)
    dni_str = str(dni).strip()
    try:
        dni_int = int(dni_str)
        mongo_filter = {"emp_pin": {"$in": [dni_int, dni_str]}}
    except ValueError:
        mongo_filter = {"emp_pin": dni_str}

    if fecha_inicio or fecha_fin:
        dia_filter = {}
        if fecha_inicio:
            dia_filter["$gte"] = fecha_inicio
        if fecha_fin:
            dia_filter["$lte"] = fecha_fin
        mongo_filter["dia"] = dia_filter

    cursor = coleccion_asistencia.find(
        mongo_filter,
        {"emp_pin": 1, "nombre": 1, "dia": 1, "hora": 1, "_id": 0}
    ).sort([("dia", -1), ("hora", 1)])

    marcajes = await cursor.to_list(length=None)

    return {
        "marcajes": [
            {"fecha": m.get("dia", ""), "hora": m.get("hora", ""), "nombre": m.get("nombre", "")}
            for m in marcajes
        ]
    }


# ═══════════════════════════════════════════════════
#  JUSTIFICAR asistencia (un dia) → MongoDB
# ═══════════════════════════════════════════════════
@router.put("/asistencia/justificar")
async def justificar_asistencia(datos: dict, token: dict = Depends(verificar_token)):
    id_personal = datos.get("id_personal")
    fecha = datos.get("fecha")
    id_catga = datos.get("id_catga")

    if not all([id_personal, fecha, id_catga]):
        raise HTTPException(status_code=400, detail="Datos incompletos (id_personal, fecha, id_catga)")

    # Registrar quién hizo el cambio desde el token JWT
    usuario_modifico = token.get("sub", "desconocido")

    doc = {
        "id_personal": int(id_personal),
        "fecha": fecha,
        "id_catga": int(id_catga),
        "hora_e": datos.get("hora_e") or None,
        "hora_s": datos.get("hora_s") or None,
        "obsv": datos.get("obsv", ""),
        "modificado_por": usuario_modifico,
        "fc": datetime.now().isoformat()
    }

    await coleccion_justificaciones.update_one(
        {"id_personal": int(id_personal), "fecha": fecha},
        {"$set": doc},
        upsert=True
    )

    # Registrar en auditoría
    await registrar_accion(
        usuario=usuario_modifico,
        accion="JUSTIFICAR",
        modulo="ASISTENCIA",
        id_afectado=int(id_personal),
        nombre_afectado="",
        datos_nuevos={"fecha": fecha, "id_catga": int(id_catga), "obsv": doc.get("obsv", "")}
    )

    return {"mensaje": "Justificacion guardada"}


# ═══════════════════════════════════════════════════
#  JUSTIFICAR rango de fechas → MongoDB
# ═══════════════════════════════════════════════════
@router.post("/asistencia/justificar-rango")
async def justificar_rango(datos: dict, token: dict = Depends(verificar_token)):
    id_personal = datos.get("id_personal")
    id_catga = datos.get("id_catga")
    fecha_inicio = datos.get("fecha_inicio")
    fecha_fin = datos.get("fecha_fin")
    hora_e = datos.get("hora_e")
    hora_s = datos.get("hora_s")
    obsv = datos.get("obsv", "")

    if not all([id_personal, id_catga, fecha_inicio, fecha_fin]):
        raise HTTPException(status_code=400, detail="Datos incompletos")

    # Registrar quién hizo el cambio desde el token JWT
    usuario_modifico = token.get("sub", "desconocido")

    fi = date.fromisoformat(fecha_inicio)
    ff = date.fromisoformat(fecha_fin)
    total = 0

    d = fi
    while d <= ff:
        doc = {
            "id_personal": int(id_personal),
            "fecha": str(d),
            "id_catga": int(id_catga),
            "hora_e": hora_e or None,
            "hora_s": hora_s or None,
            "obsv": obsv,
            "modificado_por": usuario_modifico,
            "fc": datetime.now().isoformat()
        }
        await coleccion_justificaciones.update_one(
            {"id_personal": int(id_personal), "fecha": str(d)},
            {"$set": doc},
            upsert=True
        )
        total += 1
        d += timedelta(days=1)

    # Registrar en auditoría
    await registrar_accion(
        usuario=usuario_modifico,
        accion="JUSTIFICAR_RANGO",
        modulo="ASISTENCIA",
        id_afectado=int(id_personal),
        nombre_afectado="",
        datos_nuevos={"fecha_inicio": fecha_inicio, "fecha_fin": fecha_fin, "id_catga": int(id_catga), "dias": total, "obsv": obsv}
    )

    return {"mensaje": "Justificacion guardada", "dias": total}


# ═══════════════════════════════════════════════════
#  CATEGORIAS (MySQL — tabla de configuracion)
# ═══════════════════════════════════════════════════
@router.get("/asistencia/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    if not CatgAsistencia:
        return []
    try:
        return [{"id": c.ID_CATGA, "descrip": c.DESCRIP} for c in db.query(CatgAsistencia).order_by(CatgAsistencia.DESCRIP).all()]
    except Exception as e:
        print(f"⚠️ Error categorias: {e}")
        return []


@router.post("/asistencia/categorias")
def crear_categoria(datos: dict, db: Session = Depends(get_db)):
    if not CatgAsistencia:
        raise HTTPException(status_code=500, detail="Tabla categorias no disponible")
    descrip = datos.get("descrip", "").strip()
    if not descrip:
        raise HTTPException(status_code=400, detail="Descripcion requerida")
    nueva = CatgAsistencia(DESCRIP=descrip)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id": nueva.ID_CATGA, "descrip": nueva.DESCRIP}


@router.put("/asistencia/categorias/{id_catga}")
def editar_categoria(id_catga: int, datos: dict, db: Session = Depends(get_db)):
    if not CatgAsistencia:
        raise HTTPException(status_code=500, detail="Tabla categorias no disponible")
    cat = db.query(CatgAsistencia).filter(CatgAsistencia.ID_CATGA == id_catga).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    cat.DESCRIP = datos.get("descrip", cat.DESCRIP)
    db.commit()
    return {"id": cat.ID_CATGA, "descrip": cat.DESCRIP}


# ═══════════════════════════════════════════════════
#  HORARIOS (MySQL — tabla de configuracion)
# ═══════════════════════════════════════════════════
@router.get("/asistencia/horarios")
def listar_horarios(db: Session = Depends(get_db)):
    if not Horario or not HorarioDetalle:
        return []
    try:
        horarios = db.query(Horario).filter(Horario.ESTADO == 1).order_by(Horario.NOMBRE).all()
    except:
        horarios = db.query(Horario).order_by(Horario.NOMBRE).all()

    resultado = []
    for h in horarios:
        detalles = db.query(HorarioDetalle).filter(HorarioDetalle.ID_HORARIO == h.ID_HORARIO).all()
        resultado.append({
            "id": h.ID_HORARIO,
            "nombre": h.NOMBRE,
            "descrip": getattr(h, 'DESCRIP', ''),
            "dias": [{
                "dia": d.DIA,
                "hora_e": str(d.HORA_E) if d.HORA_E else None,
                "hora_s": str(d.HORA_S) if d.HORA_S else None,
                "descanso": bool(getattr(d, 'DIA_DESC', 0))
            } for d in detalles]
        })
    return resultado


# ═══════════════════════════════════════════════════
#  VISTA GENERAL (todos los empleados) — MongoDB
# ═══════════════════════════════════════════════════
@router.get("/asistencia/general")
async def asistencia_general(
    id_empresa: int = Query(...),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    fecha_fija: Optional[str] = Query(None),
    nombre: Optional[str] = Query(None),
    id_area: Optional[int] = Query(None),
    id_depart: Optional[int] = Query(None),
    id_cargo: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    hoy = date.today()

    if fecha_fija:
        fi = ff = date.fromisoformat(fecha_fija)
    elif fecha_inicio and fecha_fin:
        fi = date.fromisoformat(fecha_inicio)
        ff = date.fromisoformat(fecha_fin)
    else:
        fi = ff = hoy

    # Empleados con contrato activo (solo trabajadores activos)
    query_p = db.query(Personal, Contrato, Cargo).join(
        Acceso, Personal.ID_ACCS == Acceso.ID_ACCS
    ).join(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).outerjoin(
        Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
    ).filter(
        Acceso.ID_ESTADO == 1,
        Cargo.ID_EMP == id_empresa,
        Contrato.ID_ESTADO_CONTRATO == 1
    )

    if id_area:
        query_p = query_p.filter(Contrato.ID_AREA == id_area)
    if id_depart:
        query_p = query_p.filter(Cargo.ID_DEPART == id_depart)
    if id_cargo:
        query_p = query_p.filter(Contrato.ID_CARGO == id_cargo)
    if nombre:
        busq = f"%{nombre}%"
        query_p = query_p.filter(
            (Personal.NOMBRES.ilike(busq)) |
            (Personal.APE_PATERNO.ilike(busq)) |
            (Personal.APE_MATERNO.ilike(busq)) |
            (Personal.NUM_DOC.ilike(busq))
        )

    registros = query_p.all()

    # Catalogos MySQL (batch)
    areas_map = {a.ID_AREA: a.DESCRIP for a in db.query(Area).all()}
    depart_map = {d.ID_DEPART: d.DESCRIP for d in db.query(Departamento).all()}
    categorias = _mapa_categorias(db)

    # Pre-cargar TODOS los horarios de MySQL en una sola vez
    horarios_cache = {}
    horarios_nombres = {}
    if HorarioDetalle:
        for dh in db.query(HorarioDetalle).all():
            wd = DIA_BD_A_WEEKDAY.get(dh.DIA)
            if wd is not None:
                horarios_cache.setdefault(dh.ID_HORARIO, {})[wd] = {
                    "hora_e": str(dh.HORA_E) if dh.HORA_E else None,
                    "hora_s": str(dh.HORA_S) if dh.HORA_S else None,
                    "descanso": bool(getattr(dh, 'DIA_DESC', 0))
                }
    horarios_descrips = {}
    if Horario:
        for h in db.query(Horario).all():
            horarios_nombres[h.ID_HORARIO] = h.NOMBRE
            horarios_descrips[h.ID_HORARIO] = h.DESCRIP or ''
    horarios_rangos = construir_rangos_horarios(db)

    # ── Cargar TODOS los marcajes y justificaciones de MongoDB en lote ──
    marcajes_por_pin = await _marcajes_mongo_todos(fi, ff)
    justif_por_personal = await _justificaciones_mongo_todas(fi, ff)

    resultado = []
    total_global = {"asistencias": 0, "tardanzas": 0, "faltas": 0, "min_tardanza": 0}

    for p, contrato, cargo_obj in registros:
        # Ya no se omite si no tiene contrato: se muestra igual con datos por defecto

        id_horario = (getattr(contrato, 'ID_HORARIO', None) or 1) if contrato else 1
        horario_dias = horarios_cache.get(id_horario, {})

        # Marcajes del huellero por DNI
        dni = str(getattr(p, 'NUM_DOC', '') or '').strip()
        marcajes_por_dia = dict(marcajes_por_pin.get(dni, {}))
        # Intentar tambien con DNI como entero (por si MongoDB lo almaceno como int)
        try:
            dni_int = str(int(dni))
            if dni_int != dni:
                for dia, horas in marcajes_por_pin.get(dni_int, {}).items():
                    marcajes_por_dia.setdefault(dia, []).extend(horas)
        except (ValueError, TypeError):
            pass

        justif_por_fecha = justif_por_personal.get(p.ID_PERSONAL, {})

        dias, resumen = _procesar_dias_nosql(fi, ff, marcajes_por_dia, justif_por_fecha, horario_dias, categorias)

        nombre_comp = f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}"
        area_nombre = areas_map.get(getattr(contrato, 'ID_AREA', None), '') if contrato else ''
        depart_nombre = depart_map.get(getattr(cargo_obj, 'ID_DEPART', None), '') if cargo_obj else ''
        cargo_nombre = getattr(cargo_obj, 'DESCRIP', '') if cargo_obj else ''

        total_global["asistencias"] += resumen["total_asistencias"]
        total_global["tardanzas"] += resumen["total_tardanzas"]
        total_global["faltas"] += resumen["total_faltas"]
        total_global["min_tardanza"] += resumen["total_min_tardanza"]

        resultado.append({
            "id_personal": p.ID_PERSONAL,
            "nombre": nombre_comp,
            "dni": dni,
            "area": area_nombre,
            "departamento": depart_nombre,
            "cargo": cargo_nombre,
            "foto": getattr(p, 'FOTO', None),
            "horario_nombre": horarios_nombres.get(id_horario, "Sin horario"),
            "horario_descrip": horarios_descrips.get(id_horario, ""),
            "horario_rango": horarios_rangos.get(id_horario, ""),
            "asistencias": resumen["total_asistencias"],
            "tardanzas": resumen["total_tardanzas"],
            "faltas": resumen["total_faltas"],
            "min_tardanza": resumen["total_min_tardanza"],
            "dias": dias
        })

    return {
        "empleados": resultado,
        "resumen_global": total_global,
        "rango": {"inicio": str(fi), "fin": str(ff)},
        "total_empleados": len(resultado)
    }
