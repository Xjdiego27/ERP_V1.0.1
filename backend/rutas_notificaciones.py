from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db, Personal, Contrato, Acceso, Horario, HorarioDetalle, Cargo
try:
    from database import Ticket
except ImportError:
    Ticket = None
from mongodb import coleccion_menus, coleccion_eventos, coleccion_asistencia, coleccion_justificaciones, coleccion_notif_tickets, coleccion_saludos_cumple
from auth_token import verificar_token

router = APIRouter()


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

    # ── 2. Cumpleaños de hoy (TODAS las empresas) ──
    cumples_raw = db.query(Personal).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).join(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).filter(
        Acceso.ID_ESTADO == 1,
        Contrato.ID_ESTADO_CONTRATO == 1,
        extract('month', Personal.FECH_NAC) == hoy.month,
        extract('day', Personal.FECH_NAC) == hoy.day,
    ).all()

    # Deduplicar (un empleado puede tener varios contratos)
    _vistos = set()
    cumples = []
    for _p in cumples_raw:
        if _p.ID_PERSONAL not in _vistos:
            _vistos.add(_p.ID_PERSONAL)
            cumples.append(_p)

    for p in cumples:
        items.append({
            "tipo": "cumpleanos",
            "texto": f"¡Hoy es el cumpleaños de {p.NOMBRES} {p.APE_PATERNO}!",
            "icono": "cake-candles",
            "foto": p.FOTO,
            "urgente": False,
        })

    # ── 2b. Aviso de cumpleaños próximos (1–2 días antes) — para TODO el personal, TODAS las empresas ──
    for dias_antes in [1, 2]:
        fecha_objetivo = hoy + timedelta(days=dias_antes)
        cumples_prox_raw = db.query(Personal).join(
            Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
        ).join(
            Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
        ).filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
            extract('month', Personal.FECH_NAC) == fecha_objetivo.month,
            extract('day', Personal.FECH_NAC) == fecha_objetivo.day,
        ).all()

        _vistos_prox = set()
        cumples_prox = []
        for _pp in cumples_prox_raw:
            if _pp.ID_PERSONAL not in _vistos_prox:
                _vistos_prox.add(_pp.ID_PERSONAL)
                cumples_prox.append(_pp)

        for p in cumples_prox:
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
            })
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
    }, sort=[("fecha_subida", -1)])

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
    }).sort("fecha_subida", -1)

    eventos_hoy = await cursor.to_list(length=50)
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
        justif_hoy_cursor = coleccion_justificaciones.find({"fecha": hoy_str}, {"id_personal": 1})
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

        # Tickets creados hoy
        inicio_hoy = datetime.combine(hoy, datetime.min.time())
        nuevos_hoy = db.query(Ticket).filter(
            Ticket.FECH_CREACION >= inicio_hoy
        ).order_by(desc(Ticket.FECH_CREACION)).limit(10).all()
        for tk in nuevos_hoy:
            creador = db.query(Personal).filter(Personal.ID_PERSONAL == tk.ID_PERSONAL).first()
            nombre_c = f"{creador.NOMBRES} {creador.APE_PATERNO}" if creador else "Usuario"
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
        }).sort("fecha", -1).limit(20)
        notifs_ticket = await cursor_notif.to_list(length=20)
        for nt in notifs_ticket:
            items.append({
                "tipo": nt.get("tipo", "ticket"),
                "texto": nt.get("texto", "Actualización de ticket"),
                "icono": "ticket",
                "urgente": False,
                "id_notif": str(nt["_id"]),
            })

    # Ordenar: urgentes primero, luego por tipo
    prioridad = {"contrato": 0, "falta": 1, "saludo_pendiente": 2, "ticket_reabierto": 3, "ticket_creado": 3, "ticket_nuevo": 3, "ticket_estado": 4, "ticket": 5, "cumpleanos": 6, "cumpleanos_proximo": 7, "evento": 8, "menu": 9}
    items.sort(key=lambda x: (0 if x.get("urgente") else 1, prioridad.get(x["tipo"], 9)))

    return {
        "total": len(items),
        "items": items,
    }
