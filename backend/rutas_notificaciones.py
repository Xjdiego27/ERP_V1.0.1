from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_, and_
from database import (
    get_db, Personal, Contrato, Acceso, Horario, HorarioDetalle, Cargo,
    Ticket, Mantenimiento, Equipo, EspecificacionesTec,
)
from mongodb import coleccion_menus, coleccion_eventos, coleccion_asistencia, coleccion_justificaciones, coleccion_notif_tickets, coleccion_saludos_cumple
from auth_token import verificar_token

router = APIRouter()


def _deduplicar_personal(raw_list):
    """Deduplica personal por ID_PERSONAL."""
    vistos = set()
    resultado = []
    for p in raw_list:
        if p.ID_PERSONAL not in vistos:
            vistos.add(p.ID_PERSONAL)
            resultado.append(p)
    return resultado


@router.get("/notificaciones")
async def obtener_notificaciones(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """
    Retorna notificaciones agrupadas:
    - contratos_por_vencer: empleados cuyo FECH_CESE está dentro de los próximos 7 días
    - cumpleanos_hoy: empleados que cumplen años hoy
    - menu_actualizado: si el menú se actualizó hoy
    - eventos_recientes: eventos subidos hoy
    """
    hoy = datetime.now().date()
    limite = hoy + timedelta(days=7)
    id_empresa = token.get("id_emp")
    rol_usuario = (token.get("rol") or "").strip().upper()
    es_admin = rol_usuario in ("ADMINISTRADOR", "ADMIN")
    items = []

    # ── 1. Contratos por vencer (dentro de 7 días) — solo para ADMIN ──
    if es_admin:
      registros = db.query(Personal, Contrato).join(
          Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
      ).outerjoin(
          Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
      ).outerjoin(
          Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
      ).filter(
          Acceso.ID_ESTADO == 1,
          Cargo.ID_EMP == id_empresa,
          Contrato.ID_ESTADO_CONTRATO == 1
      ).all()

      for p, c in registros:
          if c and c.FECH_CESE:
              fech_cese = c.FECH_CESE
              if hasattr(fech_cese, 'date'):
                  fech_cese = fech_cese.date()
              if hoy <= fech_cese <= limite:
                  dias_restantes = (fech_cese - hoy).days
                  nombre = f"{p.NOMBRES} {p.APE_PATERNO}"
                  if dias_restantes == 0:
                      texto = f"Contrato de {nombre} vence HOY"
                  elif dias_restantes == 1:
                      texto = f"Contrato de {nombre} vence mañana"
                  else:
                      texto = f"Contrato de {nombre} vence en {dias_restantes} días"
                  items.append({
                      "tipo": "contrato",
                      "texto": texto,
                      "icono": "file-contract",
                      "fecha": str(fech_cese),
                      "urgente": dias_restantes <= 2,
                  })

    # ── 2. Cumpleaños: HOY + próximos 2 días — UNA sola query ──
    fechas_cumple = [hoy + timedelta(days=d) for d in range(3)]  # hoy, mañana, pasado
    filtros_cumple = [
        and_(
            extract('month', Personal.FECH_NAC) == f.month,
            extract('day', Personal.FECH_NAC) == f.day,
        ) for f in fechas_cumple
    ]
    cumples_all_raw = db.query(Personal).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).join(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).filter(
        Acceso.ID_ESTADO == 1,
        Contrato.ID_ESTADO_CONTRATO == 1,
        or_(*filtros_cumple),
    ).all()

    # Clasificar por día
    cumples = []       # hoy
    cumples_prox = {}  # {dias_antes: [personal]}
    for p in _deduplicar_personal(cumples_all_raw):
        if not p.FECH_NAC:
            continue
        nac = p.FECH_NAC.date() if hasattr(p.FECH_NAC, 'date') else p.FECH_NAC
        for dias_offset, fecha_obj in enumerate(fechas_cumple):
            if nac.month == fecha_obj.month and nac.day == fecha_obj.day:
                if dias_offset == 0:
                    cumples.append(p)
                else:
                    cumples_prox.setdefault(dias_offset, []).append(p)
                break

    for p in cumples:
        items.append({
            "tipo": "cumpleanos",
            "texto": f"¡Hoy es el cumpleaños de {p.NOMBRES} {p.APE_PATERNO}!",
            "icono": "cake-candles",
            "foto": p.FOTO,
            "urgente": False,
        })

    # ── 2b. Aviso de cumpleaños próximos (1–2 días antes) ──
    for dias_antes in [1, 2]:
        for p in cumples_prox.get(dias_antes, []):
            if dias_antes == 1:
                texto = f"¡Mañana es el cumpleaños de {p.NOMBRES} {p.APE_PATERNO}! Prepara tu saludo"
            else:
                texto = f"En {dias_antes} días es el cumpleaños de {p.NOMBRES} {p.APE_PATERNO}. Prepara tu saludo"
            items.append({
                "tipo": "cumpleanos_proximo",
                "texto": texto,
                "icono": "cake-candles",
                "foto": p.FOTO,
                "urgente": False,
            })

    # ── 2c. Aviso de saludo de cumpleaños pendiente HOY ──
    id_accs_usuario = token.get("id_accs")
    mi_personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs_usuario).first() if id_accs_usuario else None
    if mi_personal and cumples:
        anio_actual = hoy.year
        for c in cumples:
            if c.ID_PERSONAL == mi_personal.ID_PERSONAL:
                continue  # no se saluda a sí mismo
            doc_saludo = await coleccion_saludos_cumple.find_one({
                "id_personal_cumple": c.ID_PERSONAL,
                "anio": anio_actual,
            }, {"saludos.id_personal": 1})
            ya_saludo = False
            if doc_saludo and doc_saludo.get("saludos"):
                ya_saludo = any(s["id_personal"] == mi_personal.ID_PERSONAL for s in doc_saludo["saludos"])
            if not ya_saludo:
                items.append({
                    "tipo": "saludo_pendiente",
                    "texto": f"¡Envía tu saludo de cumpleaños a {c.NOMBRES} {c.APE_PATERNO}!",
                    "icono": "gift",
                    "urgente": True,
                })

    # ── 3. Menú actualizado hoy ──
    inicio_hoy = datetime.combine(hoy, datetime.min.time())
    fin_hoy = datetime.combine(hoy, datetime.max.time())

    menu_hoy = await coleccion_menus.find_one({
        "fecha_subida": {"$gte": inicio_hoy, "$lte": fin_hoy}
    }, {"_id": 1}, sort=[("fecha_subida", -1)])

    if menu_hoy:
        items.append({
            "tipo": "menu",
            "texto": "Se actualizó el menú del día",
            "icono": "utensils",
            "urgente": False,
        })

    # ── 4. Eventos recientes (hoy — pueden ser varios) ──
    cursor = coleccion_eventos.find({
        "fecha_subida": {"$gte": inicio_hoy, "$lte": fin_hoy}
    }, {"_id": 1}).sort("fecha_subida", -1).limit(10)

    eventos_hoy = await cursor.to_list(length=10)
    for ev in eventos_hoy:
        items.append({
            "tipo": "evento",
            "texto": "Nuevo evento publicado",
            "icono": "calendar-star",
            "urgente": False,
        })

    # ── 5. Faltas del día (solo ADMIN) ─ empleados que deberían trabajar hoy y no tienen marcaje ──
    if es_admin:
        # Obtener todos los empleados de la empresa
        todos = db.query(Personal, Contrato).join(
            Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
        ).outerjoin(
            Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
        ).outerjoin(
            Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
        ).filter(
            Acceso.ID_ESTADO == 1,
            Cargo.ID_EMP == id_empresa,
            Contrato.ID_ESTADO_CONTRATO == 1
        ).all()

        # Pre-cargar horarios para saber quién descansa hoy
        DIA_BD = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7}  # weekday -> dia BD
        dia_bd_hoy = DIA_BD.get(hoy.weekday(), 1)
        descansos_por_horario = {}
        if HorarioDetalle:
            for dh in db.query(HorarioDetalle).filter(HorarioDetalle.DIA == dia_bd_hoy).all():
                descansos_por_horario[dh.ID_HORARIO] = bool(getattr(dh, 'DIA_DESC', 0))

        # DNIs que tienen marcaje hoy en MongoDB
        hoy_str = str(hoy)
        marcajes_hoy = await coleccion_asistencia.distinct("emp_pin", {"dia": hoy_str})
        pins_hoy = set(str(p).strip() for p in marcajes_hoy)

        # IDs de personal que tienen justificación hoy en MongoDB
        justif_hoy_cursor = coleccion_justificaciones.find({"fecha": hoy_str}, {"id_personal": 1, "_id": 0})
        justif_hoy_list = await justif_hoy_cursor.to_list(length=5000)
        ids_justificados = set(j["id_personal"] for j in justif_hoy_list)

        total_faltas_hoy = 0
        nombres_faltas = []
        for p, c in todos:
            id_horario = (getattr(c, 'ID_HORARIO', None) or 1) if c else 1
            es_descanso = descansos_por_horario.get(id_horario, False)
            if es_descanso:
                continue  # Descansa hoy, no es falta
            dni = str(getattr(p, 'NUM_DOC', '') or '').strip()
            if not dni:
                continue
            # Verificar también como entero
            presente = dni in pins_hoy
            if not presente:
                try:
                    presente = str(int(dni)) in pins_hoy
                except (ValueError, TypeError):
                    pass
            if not presente:
                # Verificar si tiene justificación para hoy
                if p.ID_PERSONAL in ids_justificados:
                    continue
                total_faltas_hoy += 1
                if len(nombres_faltas) < 5:
                    nombres_faltas.append(f"{p.NOMBRES} {p.APE_PATERNO}")

        if total_faltas_hoy > 0:
            texto_faltas = f"{total_faltas_hoy} empleado(s) sin asistencia hoy"
            items.append({
                "tipo": "falta",
                "texto": texto_faltas,
                "icono": "user-xmark",
                "urgente": total_faltas_hoy >= 3,
                "detalle": nombres_faltas,
            })

    # ── 6. Tickets — solo para roles TI (ADMINISTRADOR, ADMIN, SOPORTE) ──
    es_ti = rol_usuario in ("ADMINISTRADOR", "ADMIN", "SOPORTE")
    if es_ti and Ticket:
        from sqlalchemy import desc
        # Tickets abiertos (sin asignar)
        abiertos = db.query(Ticket).filter(Ticket.ESTADO == "ABIERTO").count()
        if abiertos > 0:
            items.append({
                "tipo": "ticket",
                "texto": f"{abiertos} ticket(s) abiertos sin asignar",
                "icono": "ticket",
                "urgente": abiertos >= 3,
            })

        # Tickets creados hoy — batch-load creators
        inicio_hoy = datetime.combine(hoy, datetime.min.time())
        nuevos_hoy = db.query(Ticket).filter(
            Ticket.FECH_CREACION >= inicio_hoy
        ).order_by(desc(Ticket.FECH_CREACION)).limit(10).all()

        if nuevos_hoy:
            ids_creadores = {tk.ID_PERSONAL for tk in nuevos_hoy if tk.ID_PERSONAL}
            creadores = db.query(Personal).filter(Personal.ID_PERSONAL.in_(ids_creadores)).all() if ids_creadores else []
            creadores_map = {c.ID_PERSONAL: f"{c.NOMBRES} {c.APE_PATERNO}" for c in creadores}

            for tk in nuevos_hoy:
                nombre_c = creadores_map.get(tk.ID_PERSONAL, "Usuario")
                pri = getattr(tk, 'PRIORIDAD', 'MEDIA') or 'MEDIA'
                items.append({
                    "tipo": "ticket_nuevo",
                    "texto": f"Nuevo ticket: {tk.ASUNTO} — {nombre_c} [{pri}]",
                    "icono": "ticket",
                    "urgente": pri in ("ALTA", "URGENTE"),
                })

        # Tickets asignados hoy (cambio de estado)
        asignados_hoy = db.query(Ticket).filter(
            Ticket.ESTADO == "ASIGNADO",
            Ticket.FECH_CREACION < inicio_hoy,  # no repetir los creados hoy
        ).count()
        if asignados_hoy > 0:
            items.append({
                "tipo": "ticket",
                "texto": f"{asignados_hoy} ticket(s) en estado asignado pendientes",
                "icono": "ticket",
                "urgente": False,
            })

        # Tickets resueltos (en progreso) pendientes de cerrar
        resueltos = db.query(Ticket).filter(Ticket.ESTADO == "RESUELTO").count()
        if resueltos > 0:
            items.append({
                "tipo": "ticket",
                "texto": f"{resueltos} ticket(s) resueltos pendientes de cerrar",
                "icono": "ticket",
                "urgente": False,
            })

    # ── 7. Notificaciones personales de tickets (MongoDB) ──
    # Obtener id_personal del usuario actual
    id_accs = token.get("id_accs")
    persona_actual = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first() if id_accs else None
    if persona_actual:
        # Traer notificaciones no leídas de las últimas 24 horas
        hace_24h = datetime.now() - timedelta(hours=24)
        cursor_notif = coleccion_notif_tickets.find({
            "id_personal": persona_actual.ID_PERSONAL,
            "leido": False,
            "fecha": {"$gte": hace_24h},
        }, {"tipo": 1, "texto": 1}).sort("fecha", -1).limit(20)
        notifs_ticket = await cursor_notif.to_list(length=20)
        for nt in notifs_ticket:
            items.append({
                "tipo": nt.get("tipo", "ticket"),
                "texto": nt.get("texto", "Actualización de ticket"),
                "icono": "ticket",
                "urgente": False,
                "id_notif": str(nt["_id"]),
            })

    # ── 8. Mantenimientos programados — solo para ADMIN / TI ──
    if Mantenimiento and (es_admin or rol_usuario in ("SOPORTE",)):
        hoy_dt = datetime.combine(hoy, datetime.min.time())
        limite_mant = hoy + timedelta(days=7)
        from sqlalchemy import and_ as sa_and
        mants = db.query(Mantenimiento).filter(
            Mantenimiento.ESTADO.in_(["PENDIENTE", "EN_PROCESO"]),
            Mantenimiento.FECHA_PROG <= limite_mant,
        ).order_by(Mantenimiento.FECHA_PROG.asc()).limit(20).all()

        # Precarga equipos para nombres
        eq_ids = list(set(m.ID_EQUIPO for m in mants if m.ID_EQUIPO))
        equipo_map_m = {}
        espec_map_m = {}
        if eq_ids and Equipo and EspecificacionesTec:
            for e in db.query(Equipo).filter(Equipo.ID_EQUIPO.in_(eq_ids)).all():
                equipo_map_m[e.ID_EQUIPO] = e
            for es in db.query(EspecificacionesTec).all():
                espec_map_m[es.ID_ESPEC] = es

        # Precarga técnicos
        tec_ids = list(set(m.ID_TECNICO for m in mants if m.ID_TECNICO))
        tec_map = {}
        if tec_ids:
            for p in db.query(Personal).filter(Personal.ID_PERSONAL.in_(tec_ids)).all():
                tec_map[p.ID_PERSONAL] = f"{p.NOMBRES} {p.APE_PATERNO}"

        for m in mants:
            eq = equipo_map_m.get(m.ID_EQUIPO)
            espec = espec_map_m.get(eq.ID_ESPEC) if eq else None
            codigo_eq = (espec.CODIGOE if espec else '') or (eq.SERIE_EQUIPO if eq else '')
            tec_nombre = tec_map.get(m.ID_TECNICO, 'Sin asignar')
            fecha_prog = m.FECHA_PROG
            if hasattr(fecha_prog, 'date'):
                fecha_prog = fecha_prog.date()
            dias_rest = (fecha_prog - hoy).days

            if dias_rest < 0:
                texto = f"Mantenimiento vencido: {codigo_eq} ({m.TIPO_MANTENIMIENTO}) — Téc: {tec_nombre}"
                urgente = True
            elif dias_rest == 0:
                texto = f"Mantenimiento HOY: {codigo_eq} ({m.TIPO_MANTENIMIENTO}) — Téc: {tec_nombre}"
                urgente = True
            elif dias_rest == 1:
                texto = f"Mantenimiento mañana: {codigo_eq} ({m.TIPO_MANTENIMIENTO}) — Téc: {tec_nombre}"
                urgente = True
            else:
                texto = f"Mantenimiento en {dias_rest} días: {codigo_eq} ({m.TIPO_MANTENIMIENTO}) — Téc: {tec_nombre}"
                urgente = dias_rest <= 3

            items.append({
                "tipo": "mantenimiento",
                "texto": texto,
                "icono": "wrench",
                "fecha": str(fecha_prog),
                "urgente": urgente,
            })

    # Ordenar: urgentes primero, luego por tipo
    prioridad = {"contrato": 0, "falta": 1, "saludo_pendiente": 2, "mantenimiento": 3, "ticket_reabierto": 4, "ticket_creado": 4, "ticket_nuevo": 4, "ticket_estado": 5, "ticket": 6, "cumpleanos": 7, "cumpleanos_proximo": 8, "evento": 9, "menu": 10}
    items.sort(key=lambda x: (0 if x.get("urgente") else 1, prioridad.get(x["tipo"], 10)))

    return {
        "total": len(items),
        "items": items,
    }
