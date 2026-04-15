# ============================================
# RUTAS TICKETS — Sistema de tickets de soporte TI y RRHH
# Responsabilidad: CRUD de tickets, asignación, cambio de estado,
# listado por rol, categorías y subcategorías.
# Roles: ADMINISTRADOR y SOPORTE ven todos; RRHH ve solo tickets RRHH;
#        USUARIO solo los propios.
# ============================================

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from typing import Optional
from datetime import datetime
from pathlib import Path
from io import BytesIO

from database import (
    get_db, settings, Ticket, CategoriaTicket, SubcategoriaTicket,
    Personal, Acceso, Contrato, Cargo, Equipo, AsignacionEquipo, TipoEquipo,
    EspecificacionesTec,
    FamiliaSap, SubfamiliaSap, MarcaSap, ModeloSap,
    GrupoArticulos, TipoUnidad, TipoSocioNegocio,
    SapArticulo, SapServicio, SapSocioNegocio,
)
from auth_token import verificar_token
from auditoria import registrar_accion
from mongodb import coleccion_notif_tickets
from servicios.permiso_service import PermisoService

router = APIRouter()

ROLES_TI = ("ADMINISTRADOR", "ADMIN", "SOPORTE")
ID_CATEGORIA_RRHH = 5   # Categoría RRHH en la BD
ID_ROL_RRHH = 4          # Rol RRHH en la BD

_static_root = Path(settings.static_dir) if settings.static_dir else Path(__file__).resolve().parent.parent / "erp-poo" / "public"
UPLOAD_DIR = _static_root / "assets" / "tickets"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ── Helpers ──────────────────────────────────────

def _rol_token(token: dict) -> str:
    return (token.get("rol") or "").strip().upper()


def _es_ti(token: dict) -> bool:
    return _rol_token(token) in ROLES_TI


def _es_rrhh(token: dict) -> bool:
    """True si el usuario tiene rol RRHH."""
    return _rol_token(token) == "RRHH"


def _tiene_panel_tickets(token: dict, db: Session) -> bool:
    """True si el usuario es TI por rol, RRHH por rol, O tiene permiso TICKETS_PANEL asignado."""
    if _es_ti(token):
        return True
    if _es_rrhh(token):
        return True
    # Buscar ID_ROL del usuario y verificar si tiene TICKETS_PANEL
    id_accs = token.get("id_accs")
    if id_accs and Acceso:
        acc = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
        if acc:
            modulos = PermisoService(db).obtener_modulos_rol(acc.ID_ROL)
            return "TICKETS_PANEL" in modulos
    return False


def _personal_por_accs(db: Session, id_accs: int):
    """Obtiene el Personal vinculado a un ID_ACCS."""
    return db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()


async def _notificar_ticket(db: Session, id_ticket: int, tipo: str, texto: str,
                            destinatarios_ids: list = None, roles_destino: list = None,
                            id_empresa: int = None):
    """
    Inserta notificaciones de ticket en MongoDB.
    - destinatarios_ids: lista de ID_PERSONAL concretos
    - roles_destino: lista de ID_ROL (busca empleados con esos roles en la empresa)
    """
    ids = set(destinatarios_ids or [])

    if roles_destino:
        # Separar roles que deben buscar en TODAS las empresas (RRHH)
        roles_global = [r for r in roles_destino if r == ID_ROL_RRHH]
        roles_empresa = [r for r in roles_destino if r != ID_ROL_RRHH]

        # Roles que solo buscan en la empresa del ticket (ADMIN, SOPORTE)
        if roles_empresa and id_empresa:
            personas_emp = (
                db.query(Personal)
                .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
                .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
                .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
                .filter(
                    Acceso.ID_ESTADO == 1,
                    Acceso.ID_ROL.in_(roles_empresa),
                    Cargo.ID_EMP == id_empresa,
                    Contrato.ID_ESTADO_CONTRATO == 1,
                )
                .all()
            )
            for p in personas_emp:
                ids.add(p.ID_PERSONAL)

        # Roles RRHH → buscar en TODAS las empresas
        if roles_global:
            personas_global = (
                db.query(Personal)
                .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
                .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
                .filter(
                    Acceso.ID_ESTADO == 1,
                    Acceso.ID_ROL.in_(roles_global),
                    Contrato.ID_ESTADO_CONTRATO == 1,
                )
                .all()
            )
            for p in personas_global:
                ids.add(p.ID_PERSONAL)

    if not ids:
        return

    # Eliminar notificaciones anteriores no leídas del mismo ticket para los mismos destinatarios
    await coleccion_notif_tickets.delete_many({
        "id_ticket": id_ticket,
        "id_personal": {"$in": list(ids)},
        "leido": False,
    })

    docs = []
    for id_p in ids:
        docs.append({
            "id_personal": id_p,
            "id_ticket": id_ticket,
            "tipo": tipo,
            "texto": texto,
            "leido": False,
            "fecha": datetime.now(),
        })
    if docs:
        await coleccion_notif_tickets.insert_many(docs)


# ── Endpoint: Modal de reapertura de ticket ──────────
from bson import ObjectId

@router.get("/tickets/reabierto-pendiente")
async def reabierto_pendiente(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Retorna la notificación de reapertura pendiente para mostrar en modal."""
    id_accs = token.get("id_accs")
    personal = _personal_por_accs(db, id_accs)
    if not personal:
        return {"pendiente": False}

    doc = await coleccion_notif_tickets.find_one({
        "id_personal": personal.ID_PERSONAL,
        "tipo": "ticket_reabierto_modal",
        "leido": False,
    }, sort=[("fecha", -1)])

    if not doc:
        return {"pendiente": False}

    return {
        "pendiente": True,
        "id_notif": str(doc["_id"]),
        "id_ticket": doc.get("id_ticket"),
        "asunto": doc.get("asunto", ""),
        "motivo": doc.get("motivo", ""),
        "nombre_reabrio": doc.get("nombre_reabrio", ""),
    }


@router.put("/tickets/reabierto-visto/{id_notif}")
async def marcar_reabierto_visto(
    id_notif: str,
    token: dict = Depends(verificar_token),
):
    """Marca la notificación de reapertura como leída."""
    try:
        await coleccion_notif_tickets.update_one(
            {"_id": ObjectId(id_notif)},
            {"$set": {"leido": True}},
        )
    except Exception:
        pass
    return {"ok": True}


def _equipo_asignado(db: Session, id_personal: int):
    """Devuelve datos del equipo asignado a un empleado (si existe)."""
    if not AsignacionEquipo or not Equipo:
        return None
    asig = (
        db.query(AsignacionEquipo)
        .filter(AsignacionEquipo.ID_PERSONAL == id_personal)
        .order_by(AsignacionEquipo.ID_ASIG.desc())
        .first()
    )
    if not asig:
        return None
    equipo = db.query(Equipo).filter(Equipo.ID_EQUIPO == asig.ID_EQUIPO).first()
    if not equipo:
        return None
    tipo = None
    if TipoEquipo:
        t = db.query(TipoEquipo).filter(TipoEquipo.ID_TEQUIPO == equipo.ID_TEQUIPO).first()
        tipo = t.DESCRIP if t else None
    codigo = ""
    if EspecificacionesTec and equipo.ID_ESPEC:
        espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == equipo.ID_ESPEC).first()
        codigo = espec.CODIGOE if espec and espec.CODIGOE else ""
    return {
        "id_equipo": equipo.ID_EQUIPO,
        "codigo": codigo,
        "serie": equipo.SERIE_EQUIPO,
        "tipo": tipo,
    }


def _serializar_ticket(db: Session, t):
    """Convierte un registro Ticket en dict serializable."""
    # Persona que creó el ticket
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == t.ID_PERSONAL).first()
    nombre = ""
    foto_persona = None
    if persona:
        nombre = f"{persona.APE_PATERNO} {persona.APE_MATERNO}, {persona.NOMBRES}"
        foto_persona = getattr(persona, "FOTO", None)

    # Categoría / subcategoría
    cat = db.query(CategoriaTicket).filter(CategoriaTicket.ID_CATEGORIA == t.ID_CATEGORIA).first() if CategoriaTicket and t.ID_CATEGORIA else None
    subcat = db.query(SubcategoriaTicket).filter(SubcategoriaTicket.ID_SUBCATEGORIA == t.ID_SUBCATEGORIA).first() if SubcategoriaTicket and t.ID_SUBCATEGORIA else None

    # Técnico asignado
    tecnico_nombre = None
    if t.ID_TI:
        tec = db.query(Personal).filter(Personal.ID_PERSONAL == t.ID_TI).first()
        if tec:
            tecnico_nombre = f"{tec.NOMBRES} {tec.APE_PATERNO}"

    # Equipo asignado al creador
    equipo = _equipo_asignado(db, t.ID_PERSONAL) if persona else None

    # SAP data — retornar todos los ítems asociados
    es_sap = False
    sap_data = []
    if cat and cat.DESCRIP and cat.DESCRIP.upper() == 'SAP':
        es_sap = True
        if SapArticulo:
            for sa in db.query(SapArticulo).filter(SapArticulo.ID_TICKET == t.ID_TICKET).all():
                sap_data.append({"tipo": "articulo", "codigo_sap": sa.CODIGO_SAP, "id": sa.ID_SAP_ARTICULO})
        if SapServicio:
            for ss in db.query(SapServicio).filter(SapServicio.ID_TICKET == t.ID_TICKET).all():
                sap_data.append({"tipo": "servicio", "codigo_sap": ss.CODIGO_SAP, "id": ss.ID_SAP_SERVICIO})
        if SapSocioNegocio:
            for sn in db.query(SapSocioNegocio).filter(SapSocioNegocio.ID_TICKET == t.ID_TICKET).all():
                sap_data.append({"tipo": "socio", "codigo_sap": sn.CODIGO_SAP, "id": sn.ID_SAP_SOCIO})

    return {
        "id_ticket": t.ID_TICKET,
        "estado": t.ESTADO,
        "prioridad": t.PRIORIDAD,
        "asunto": t.ASUNTO,
        "descripcion": t.DESCRIP,
        "categoria": cat.DESCRIP if cat else None,
        "id_categoria": t.ID_CATEGORIA,
        "subcategoria": subcat.DESCRIP if subcat else None,
        "id_subcategoria": t.ID_SUBCATEGORIA,
        "nombre_creador": nombre,
        "foto_creador": foto_persona,
        "id_personal": t.ID_PERSONAL,
        "id_ti": t.ID_TI,
        "tecnico": tecnico_nombre,
        "fech_creacion": str(t.FECH_CREACION) if t.FECH_CREACION else None,
        "fech_cierre": str(t.FECH_CIERRE) if t.FECH_CIERRE else None,
        "mensaje_ti": t.MENSAJE_TI,
        "valoracion": t.VALORACION,
        "foto": t.FOTO,
        "equipo": equipo,
        "es_sap": es_sap,
        "sap_data": sap_data,
    }


# ── Catálogos ────────────────────────────────────

@router.get("/tickets/categorias")
def listar_categorias(db: Session = Depends(get_db), _: dict = Depends(verificar_token)):
    if not CategoriaTicket:
        return []
    return [{"id": c.ID_CATEGORIA, "nombre": c.DESCRIP} for c in db.query(CategoriaTicket).all()]


@router.get("/tickets/subcategorias")
def listar_subcategorias(db: Session = Depends(get_db), _: dict = Depends(verificar_token)):
    if not SubcategoriaTicket:
        return []
    return [
        {"id": s.ID_SUBCATEGORIA, "nombre": s.DESCRIP, "id_categoria": s.ID_CATEGORIA}
        for s in db.query(SubcategoriaTicket).all()
    ]


# ── Catálogos SAP ────────────────────────────────

@router.get("/tickets/sap/catalogos")
def catalogos_sap(db: Session = Depends(get_db), _: dict = Depends(verificar_token)):
    """Devuelve todos los catálogos necesarios para los formularios SAP."""
    def _lista(model, pk, desc):
        if not model:
            return []
        return [{"id": getattr(r, pk), "nombre": getattr(r, desc)} for r in db.query(model).all()]

    # Subfamilias con referencia a familia
    subfamilias = []
    if SubfamiliaSap:
        for s in db.query(SubfamiliaSap).all():
            subfamilias.append({"id": s.ID_SBFAMSAP, "nombre": s.DESCRIP, "id_familia": s.ID_FAMSAP})

    # grupo_articulos con campo COD_SERV_ART
    grupos = []
    if GrupoArticulos:
        for g in db.query(GrupoArticulos).all():
            grupos.append({"id": g.ID_GRP_ART, "nombre": g.DESCRIP, "cod_serv_art": g.COD_SERV_ART})

    return {
        "familias": _lista(FamiliaSap, "ID_FAMSAP", "DESCRIP"),
        "subfamilias": subfamilias,
        "marcas": _lista(MarcaSap, "ID_MARCASAP", "DESCRIP"),
        "modelos": _lista(ModeloSap, "ID_MODELOSAP", "DESCRIP"),
        "grupos_articulos": grupos,
        "tipos_unidad": _lista(TipoUnidad, "ID_UNIDAD", "DESCRIP"),
        "tipos_socio": _lista(TipoSocioNegocio, "ID_TSOCIO", "DESCRIP"),
    }


@router.get("/tickets/tecnicos")
def listar_tecnicos(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista empleados con rol SOPORTE de la empresa del usuario logueado."""
    id_empresa = token.get("id_emp")
    tecnicos = (
        db.query(Personal, Acceso)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(
            Acceso.ID_ESTADO == 1,
            Acceso.ID_ROL == 2,  # Solo SOPORTE
            Contrato.ID_ESTADO_CONTRATO == 1,
            Cargo.ID_EMP == id_empresa,
        )
        .all()
    )
    return [
        {"id_personal": p.ID_PERSONAL, "nombre": f"{p.NOMBRES} {p.APE_PATERNO}"}
        for p, a in tecnicos
    ]


@router.get("/tickets/personal-rrhh")
def listar_personal_rrhh(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Lista empleados con rol RRHH de TODAS las empresas (RRHH atiende globalmente)."""
    personal = (
        db.query(Personal, Acceso)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Acceso.ID_ESTADO == 1,
            Acceso.ID_ROL == ID_ROL_RRHH,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .all()
    )
    return [
        {"id_personal": p.ID_PERSONAL, "nombre": f"{p.NOMBRES} {p.APE_PATERNO}"}
        for p, a in personal
    ]


# ── Estadísticas (dashboard) ─────────────────────

@router.get("/tickets/estadisticas")
def estadisticas_tickets(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if not Ticket:
        return {"abiertos": 0, "asignados": 0, "en_progreso": 0, "cerrados": 0, "total": 0, "por_mes": []}

    # RRHH solo ve estadísticas de tickets RRHH
    # ADMIN/SOPORTE excluyen tickets RRHH de sus estadísticas
    solo_rrhh = _es_rrhh(token) and not _es_ti(token)
    solo_ti = _es_ti(token) and not _es_rrhh(token)

    # Conteos por estado
    q_conteos = (
        db.query(
            Ticket.ESTADO,
            func.count(Ticket.ID_TICKET),
        )
        .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(Contrato.ID_ESTADO_CONTRATO == 1)
    )
    if solo_rrhh:
        q_conteos = q_conteos.filter(Ticket.ID_CATEGORIA == ID_CATEGORIA_RRHH)
    elif solo_ti:
        q_conteos = q_conteos.filter(Ticket.ID_CATEGORIA != ID_CATEGORIA_RRHH)
    conteos = q_conteos.group_by(Ticket.ESTADO).all()
    mapa = {estado: cant for estado, cant in conteos}

    # Tickets por mes (últimos 6 meses)
    q_mes = (
        db.query(
            func.month(Ticket.FECH_CREACION).label("mes"),
            func.count(Ticket.ID_TICKET),
        )
        .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(Contrato.ID_ESTADO_CONTRATO == 1)
    )
    if solo_rrhh:
        q_mes = q_mes.filter(Ticket.ID_CATEGORIA == ID_CATEGORIA_RRHH)
    elif solo_ti:
        q_mes = q_mes.filter(Ticket.ID_CATEGORIA != ID_CATEGORIA_RRHH)
    por_mes = (
        q_mes.group_by(func.month(Ticket.FECH_CREACION))
        .order_by(func.month(Ticket.FECH_CREACION))
        .all()
    )
    meses_nombre = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    return {
        "abiertos": mapa.get("ABIERTO", 0),
        "asignados": mapa.get("ASIGNADO", 0),
        "en_progreso": mapa.get("RESUELTO", 0),
        "cerrados": mapa.get("CERRADO", 0),
        "total": sum(mapa.values()),
        "por_mes": [{"mes": meses_nombre[m] if m else "?", "cantidad": c} for m, c in por_mes],
    }


# ── Informe PDF de tickets ────────────────────────

MESES_ES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def _generar_pdf_tickets(tickets_data: list, mes: int, anio: int, nombre_usuario: str = ""):
    """Genera un PDF con métricas de tickets usando ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm,
                            leftMargin=18 * mm, rightMargin=18 * mm)
    styles = getSampleStyleSheet()
    elementos = []

    # ── Estilos personalizados ──
    titulo_style = ParagraphStyle("TituloPDF", parent=styles["Title"],
                                  fontSize=18, textColor=colors.HexColor("#1e293b"),
                                  spaceAfter=4)
    subtitulo_style = ParagraphStyle("SubtituloPDF", parent=styles["Normal"],
                                     fontSize=11, textColor=colors.HexColor("#64748b"),
                                     spaceAfter=14, alignment=TA_CENTER)
    seccion_style = ParagraphStyle("SeccionPDF", parent=styles["Heading2"],
                                   fontSize=13, textColor=colors.HexColor("#3b82f6"),
                                   spaceBefore=16, spaceAfter=8)
    normal_style = ParagraphStyle("NormalPDF", parent=styles["Normal"],
                                  fontSize=9.5, textColor=colors.HexColor("#334155"))
    kpi_label = ParagraphStyle("KPILabel", parent=styles["Normal"],
                               fontSize=9, textColor=colors.HexColor("#64748b"),
                               alignment=TA_CENTER)
    kpi_valor = ParagraphStyle("KPIValor", parent=styles["Normal"],
                               fontSize=20, textColor=colors.HexColor("#1e293b"),
                               alignment=TA_CENTER, leading=24)

    # ── Encabezado ──
    nombre_mes = MESES_ES[mes] if 1 <= mes <= 12 else str(mes)
    elementos.append(Paragraph("Informe de Tickets", titulo_style))
    sub = f"{nombre_mes} {anio}"
    if nombre_usuario:
        sub += f"  —  {nombre_usuario}"
    elementos.append(Paragraph(sub, subtitulo_style))
    elementos.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
    elementos.append(Spacer(1, 6))

    # ── Cálculo de métricas ──
    total = len(tickets_data)
    por_estado = {}
    por_prioridad = {}
    por_categoria = {}
    tiempos_resolucion = []

    for t in tickets_data:
        est = t.get("estado", "SIN ESTADO")
        por_estado[est] = por_estado.get(est, 0) + 1

        pri = t.get("prioridad", "SIN PRIORIDAD")
        por_prioridad[pri] = por_prioridad.get(pri, 0) + 1

        cat = t.get("categoria") or "Sin categoría"
        por_categoria[cat] = por_categoria.get(cat, 0) + 1

        # Tiempo de resolución (si tiene fecha de cierre)
        if t.get("fech_creacion") and t.get("fech_cierre"):
            try:
                fc = datetime.fromisoformat(str(t["fech_creacion"]))
                ff = datetime.fromisoformat(str(t["fech_cierre"]))
                horas = (ff - fc).total_seconds() / 3600
                if horas >= 0:
                    tiempos_resolucion.append(horas)
            except Exception:
                pass

    resueltos = por_estado.get("CERRADO", 0) + por_estado.get("RESUELTO", 0)
    pct_resolucion = round((resueltos / total) * 100, 1) if total > 0 else 0
    promedio_horas = round(sum(tiempos_resolucion) / len(tiempos_resolucion), 1) if tiempos_resolucion else 0

    # ── KPIs principales (tabla visual) ──
    elementos.append(Paragraph("Resumen General", seccion_style))

    kpi_data = [
        [Paragraph("Total Tickets", kpi_label),
         Paragraph("Cerrados / Resueltos", kpi_label),
         Paragraph("Tasa Resolución", kpi_label),
         Paragraph("Tiempo Prom. (hrs)", kpi_label)],
        [Paragraph(str(total), kpi_valor),
         Paragraph(str(resueltos), kpi_valor),
         Paragraph(f"{pct_resolucion}%", kpi_valor),
         Paragraph(str(promedio_horas), kpi_valor)],
    ]
    kpi_table = Table(kpi_data, colWidths=[doc.width / 4] * 4)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elementos.append(kpi_table)
    elementos.append(Spacer(1, 6))

    # ── KPI de Calificaciones / Valoraciones ──
    val_counts = {1: 0, 2: 0, 3: 0}
    val_total = 0
    val_sum = 0
    sin_calificar = 0
    for t in tickets_data:
        v = t.get("valoracion")
        if v and v in (1, 2, 3):
            val_counts[v] += 1
            val_total += 1
            val_sum += v
        elif t.get("estado") in ("CERRADO", "RESUELTO"):
            sin_calificar += 1
    val_promedio = round(val_sum / val_total, 2) if val_total > 0 else 0

    elementos.append(Paragraph("Calificaciones de Servicio", seccion_style))

    estrellas_labels = {
        1: "\u2605 Malo",
        2: "\u2605\u2605 Regular",
        3: "\u2605\u2605\u2605 Bueno",
    }
    cal_kpi_data = [
        [Paragraph(estrellas_labels[1], kpi_label),
         Paragraph(estrellas_labels[2], kpi_label),
         Paragraph(estrellas_labels[3], kpi_label),
         Paragraph("Promedio", kpi_label),
         Paragraph("Sin calificar", kpi_label)],
        [Paragraph(str(val_counts[1]), kpi_valor),
         Paragraph(str(val_counts[2]), kpi_valor),
         Paragraph(str(val_counts[3]), kpi_valor),
         Paragraph(f"{val_promedio} \u2605", kpi_valor),
         Paragraph(str(sin_calificar), kpi_valor)],
    ]
    cal_kpi_table = Table(cal_kpi_data, colWidths=[doc.width / 5] * 5)
    cal_kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elementos.append(cal_kpi_table)
    elementos.append(Spacer(1, 6))

    # ── Por Estado ──
    elementos.append(Paragraph("Tickets por Estado", seccion_style))
    estado_rows = [["Estado", "Cantidad", "%"]]
    for est in ["ABIERTO", "ASIGNADO", "RESUELTO", "CERRADO"]:
        cant = por_estado.get(est, 0)
        pct = round((cant / total) * 100, 1) if total > 0 else 0
        estado_rows.append([est, str(cant), f"{pct}%"])
    # Otros estados si existen
    for est, cant in por_estado.items():
        if est not in ("ABIERTO", "ASIGNADO", "RESUELTO", "CERRADO"):
            pct = round((cant / total) * 100, 1) if total > 0 else 0
            estado_rows.append([est, str(cant), f"{pct}%"])

    tbl_estado = Table(estado_rows, colWidths=[doc.width * 0.45, doc.width * 0.25, doc.width * 0.30])
    tbl_estado.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tbl_estado)
    elementos.append(Spacer(1, 6))

    # ── Por Prioridad ──
    elementos.append(Paragraph("Tickets por Prioridad", seccion_style))
    pri_rows = [["Prioridad", "Cantidad", "%"]]
    for pri in ["BAJA", "MEDIA", "ALTA", "URGENTE"]:
        cant = por_prioridad.get(pri, 0)
        pct = round((cant / total) * 100, 1) if total > 0 else 0
        pri_rows.append([pri, str(cant), f"{pct}%"])
    for pri, cant in por_prioridad.items():
        if pri not in ("BAJA", "MEDIA", "ALTA", "URGENTE"):
            pct = round((cant / total) * 100, 1) if total > 0 else 0
            pri_rows.append([pri, str(cant), f"{pct}%"])

    colores_pri = {"BAJA": "#16a34a", "MEDIA": "#d97706", "ALTA": "#ea580c", "URGENTE": "#dc2626"}
    tbl_pri = Table(pri_rows, colWidths=[doc.width * 0.45, doc.width * 0.25, doc.width * 0.30])
    tbl_pri.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8b5cf6")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elementos.append(tbl_pri)
    elementos.append(Spacer(1, 6))

    # ── Por Categoría ──
    if por_categoria:
        elementos.append(Paragraph("Tickets por Categoría", seccion_style))
        cat_rows = [["Categoría", "Cantidad", "%"]]
        for cat_name in sorted(por_categoria.keys()):
            cant = por_categoria[cat_name]
            pct = round((cant / total) * 100, 1) if total > 0 else 0
            cat_rows.append([cat_name, str(cant), f"{pct}%"])
        tbl_cat = Table(cat_rows, colWidths=[doc.width * 0.45, doc.width * 0.25, doc.width * 0.30])
        tbl_cat.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0891b2")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elementos.append(tbl_cat)
        elementos.append(Spacer(1, 6))

    # ── Detalle de tickets ──
    if tickets_data:
        elementos.append(Paragraph("Detalle de Tickets", seccion_style))
        det_rows = [["#", "Creador", "Asunto", "Estado", "Prioridad", "Técnico", "Creación", "Cierre"]]
        for t in tickets_data:
            fch = ""
            if t.get("fech_creacion"):
                try:
                    dt = datetime.fromisoformat(str(t["fech_creacion"]))
                    fch = dt.strftime("%d/%m/%Y %H:%M")
                except Exception:
                    fch = str(t["fech_creacion"])[:16]

            fch_cierre = ""
            if t.get("fech_cierre"):
                try:
                    dt2 = datetime.fromisoformat(str(t["fech_cierre"]))
                    fch_cierre = dt2.strftime("%d/%m/%Y %H:%M")
                except Exception:
                    fch_cierre = str(t["fech_cierre"])[:16]

            det_rows.append([
                str(t.get("id_ticket", "")),
                Paragraph(str(t.get("nombre_creador", "") or "")[:30], normal_style),
                Paragraph(str(t.get("asunto", ""))[:40], normal_style),
                t.get("estado", ""),
                t.get("prioridad", ""),
                Paragraph(str(t.get("tecnico", "") or "—")[:25], normal_style),
                fch,
                fch_cierre or "—",
            ])

        col_w = [doc.width * 0.05, doc.width * 0.14, doc.width * 0.18, doc.width * 0.10,
                 doc.width * 0.10, doc.width * 0.13, doc.width * 0.15, doc.width * 0.15]
        tbl_det = Table(det_rows, colWidths=col_w, repeatRows=1)
        tbl_det.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elementos.append(tbl_det)

    # ── Pie de página ──
    elementos.append(Spacer(1, 20))
    elementos.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1")))
    pie_style = ParagraphStyle("Pie", parent=styles["Normal"],
                               fontSize=7.5, textColor=colors.HexColor("#94a3b8"),
                               alignment=TA_CENTER, spaceBefore=6)
    elementos.append(Paragraph(
        f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — Sistema ERP",
        pie_style,
    ))

    doc.build(elementos)
    buf.seek(0)
    return buf


@router.get("/tickets/informe-pdf")
def informe_tickets_pdf(
    mes: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    anio: int = Query(..., ge=2020, le=2099, description="Año"),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """
    Genera un informe PDF con métricas de tickets del mes/año indicados.
    - ADMIN/SOPORTE: todos los tickets de todas las empresas.
    - USUARIO: solo sus propios tickets.
    """
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo de tickets no disponible")

    id_accs = token.get("id_accs")
    id_empresa = token.get("id_emp")
    es_ti = _tiene_panel_tickets(token, db)

    # Base query filtrada por mes y año
    query = (
        db.query(Ticket)
        .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Contrato.ID_ESTADO_CONTRATO == 1,
            extract("month", Ticket.FECH_CREACION) == mes,
            extract("year", Ticket.FECH_CREACION) == anio,
        )
    )

    nombre_usuario = ""
    if es_ti:
        # RRHH solo ve tickets RRHH; TI excluye los RRHH
        if _es_rrhh(token) and not _es_ti(token):
            query = query.filter(Ticket.ID_CATEGORIA == ID_CATEGORIA_RRHH)
        elif _es_ti(token) and not _es_rrhh(token):
            query = query.filter(Ticket.ID_CATEGORIA != ID_CATEGORIA_RRHH)
    else:
        # Usuario solo sus tickets
        persona = _personal_por_accs(db, id_accs)
        if not persona:
            raise HTTPException(status_code=404, detail="Personal no encontrado")
        query = (
            query
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(Cargo.ID_EMP == id_empresa, Ticket.ID_PERSONAL == persona.ID_PERSONAL)
        )
        nombre_usuario = f"{persona.NOMBRES} {persona.APE_PATERNO} {persona.APE_MATERNO}"

    tickets = query.order_by(Ticket.FECH_CREACION.asc()).all()

    # Serializar para el generador de PDF
    tickets_data = []
    for t in tickets:
        cat = db.query(CategoriaTicket).filter(
            CategoriaTicket.ID_CATEGORIA == t.ID_CATEGORIA
        ).first() if CategoriaTicket and t.ID_CATEGORIA else None

        # Nombre del creador
        creador = db.query(Personal).filter(Personal.ID_PERSONAL == t.ID_PERSONAL).first()
        nombre_creador = ""
        if creador:
            nombre_creador = f"{creador.APE_PATERNO} {creador.APE_MATERNO}, {creador.NOMBRES}"

        # Nombre del técnico asignado
        tecnico_nombre = None
        if t.ID_TI:
            tec = db.query(Personal).filter(Personal.ID_PERSONAL == t.ID_TI).first()
            if tec:
                tecnico_nombre = f"{tec.NOMBRES} {tec.APE_PATERNO}"

        tickets_data.append({
            "id_ticket": t.ID_TICKET,
            "estado": t.ESTADO,
            "prioridad": t.PRIORIDAD,
            "asunto": t.ASUNTO,
            "categoria": cat.DESCRIP if cat else None,
            "nombre_creador": nombre_creador,
            "tecnico": tecnico_nombre,
            "fech_creacion": str(t.FECH_CREACION) if t.FECH_CREACION else None,
            "fech_cierre": str(t.FECH_CIERRE) if t.FECH_CIERRE else None,
            "valoracion": t.VALORACION,
        })

    pdf_buf = _generar_pdf_tickets(tickets_data, mes, anio, nombre_usuario)
    nombre_mes = MESES_ES[mes] if 1 <= mes <= 12 else str(mes)
    filename = f"Informe_Tickets_{nombre_mes}_{anio}.pdf"

    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── CRUD Tickets ─────────────────────────────────

@router.get("/tickets")
def listar_tickets(
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
    limite: int = Query(100, ge=1, le=500, description="Máximo de tickets a retornar"),
    pagina: int = Query(1, ge=1, description="Página (1-based)"),
):
    """Admin/Soporte ven todos los tickets de TODAS las empresas; Usuario solo los propios de su empresa."""
    if not Ticket:
        return []

    id_empresa = token.get("id_emp")
    id_accs = token.get("id_accs")
    es_panel = _tiene_panel_tickets(token, db)

    if es_panel:
        query = (
            db.query(Ticket)
            .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
            .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .filter(Contrato.ID_ESTADO_CONTRATO == 1)
        )
        # RRHH solo ve tickets de categoría RRHH; TI excluye los RRHH
        if _es_rrhh(token) and not _es_ti(token):
            query = query.filter(Ticket.ID_CATEGORIA == ID_CATEGORIA_RRHH)
        elif _es_ti(token) and not _es_rrhh(token):
            query = query.filter(Ticket.ID_CATEGORIA != ID_CATEGORIA_RRHH)
    else:
        query = (
            db.query(Ticket)
            .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
            .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(Cargo.ID_EMP == id_empresa, Contrato.ID_ESTADO_CONTRATO == 1)
        )
        persona = _personal_por_accs(db, id_accs)
        if not persona:
            return []
        query = query.filter(Ticket.ID_PERSONAL == persona.ID_PERSONAL)

    offset = (pagina - 1) * limite
    tickets = query.order_by(Ticket.FECH_CREACION.desc()).offset(offset).limit(limite).all()

    if not tickets:
        return []

    # ── Batch-load para eliminar N+1 queries ──
    ids_personal = {t.ID_PERSONAL for t in tickets if t.ID_PERSONAL}
    ids_ti = {t.ID_TI for t in tickets if t.ID_TI}
    ids_cat = {t.ID_CATEGORIA for t in tickets if t.ID_CATEGORIA}
    ids_subcat = {t.ID_SUBCATEGORIA for t in tickets if t.ID_SUBCATEGORIA}

    # Pre-cargar todas las personas (creadores + técnicos) en 1 sola query
    todos_ids_persona = ids_personal | ids_ti
    personas = db.query(Personal).filter(Personal.ID_PERSONAL.in_(todos_ids_persona)).all() if todos_ids_persona else []
    personas_map = {p.ID_PERSONAL: p for p in personas}

    # Pre-cargar categorías y subcategorías en 1 query cada una
    cats = db.query(CategoriaTicket).filter(CategoriaTicket.ID_CATEGORIA.in_(ids_cat)).all() if ids_cat and CategoriaTicket else []
    cats_map = {c.ID_CATEGORIA: c for c in cats}

    subcats = db.query(SubcategoriaTicket).filter(SubcategoriaTicket.ID_SUBCATEGORIA.in_(ids_subcat)).all() if ids_subcat and SubcategoriaTicket else []
    subcats_map = {s.ID_SUBCATEGORIA: s for s in subcats}

    # Pre-cargar equipos asignados en batch
    equipos_map = {}
    if ids_personal and AsignacionEquipo and Equipo:
        from sqlalchemy import func as sqlfunc
        # Subquery: última asignación por persona
        sub = (
            db.query(
                AsignacionEquipo.ID_PERSONAL,
                sqlfunc.max(AsignacionEquipo.ID_ASIG).label("max_asig")
            )
            .filter(AsignacionEquipo.ID_PERSONAL.in_(ids_personal))
            .group_by(AsignacionEquipo.ID_PERSONAL)
            .subquery()
        )
        asigs = (
            db.query(AsignacionEquipo, Equipo)
            .join(sub, AsignacionEquipo.ID_ASIG == sub.c.max_asig)
            .join(Equipo, Equipo.ID_EQUIPO == AsignacionEquipo.ID_EQUIPO)
            .all()
        )
        for asig, eq in asigs:
            tipo = None
            if TipoEquipo:
                t_eq = db.query(TipoEquipo).filter(TipoEquipo.ID_TEQUIPO == eq.ID_TEQUIPO).first()
                tipo = t_eq.DESCRIP if t_eq else None
            codigo = ""
            if EspecificacionesTec and eq.ID_ESPEC:
                espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC).first()
                codigo = espec.CODIGOE if espec and espec.CODIGOE else ""
            equipos_map[asig.ID_PERSONAL] = {
                "id_equipo": eq.ID_EQUIPO,
                "codigo": codigo,
                "serie": eq.SERIE_EQUIPO,
                "tipo": tipo,
            }

    # Pre-cargar datos SAP en batch (solo si hay tickets SAP)
    ids_tickets_sap = set()
    for t in tickets:
        cat = cats_map.get(t.ID_CATEGORIA)
        if cat and cat.DESCRIP and cat.DESCRIP.upper() == 'SAP':
            ids_tickets_sap.add(t.ID_TICKET)

    sap_map = {}
    if ids_tickets_sap:
        if SapArticulo:
            for sa in db.query(SapArticulo).filter(SapArticulo.ID_TICKET.in_(ids_tickets_sap)).all():
                sap_map[sa.ID_TICKET] = {"tipo": "articulo", "codigo_sap": sa.CODIGO_SAP}
        if SapServicio:
            for ss in db.query(SapServicio).filter(SapServicio.ID_TICKET.in_(ids_tickets_sap)).all():
                if ss.ID_TICKET not in sap_map:
                    sap_map[ss.ID_TICKET] = {"tipo": "servicio", "codigo_sap": ss.CODIGO_SAP}
        if SapSocioNegocio:
            for sn in db.query(SapSocioNegocio).filter(SapSocioNegocio.ID_TICKET.in_(ids_tickets_sap)).all():
                if sn.ID_TICKET not in sap_map:
                    sap_map[sn.ID_TICKET] = {"tipo": "socio", "codigo_sap": sn.CODIGO_SAP}

    # ── Serializar usando los mapas pre-cargados ──
    resultado = []
    for t in tickets:
        p = personas_map.get(t.ID_PERSONAL)
        nombre = f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}" if p else ""
        foto_persona = getattr(p, "FOTO", None) if p else None

        cat = cats_map.get(t.ID_CATEGORIA)
        subcat = subcats_map.get(t.ID_SUBCATEGORIA)

        tec = personas_map.get(t.ID_TI)
        tecnico_nombre = f"{tec.NOMBRES} {tec.APE_PATERNO}" if tec else None

        es_sap = bool(cat and cat.DESCRIP and cat.DESCRIP.upper() == 'SAP')

        resultado.append({
            "id_ticket": t.ID_TICKET,
            "estado": t.ESTADO,
            "prioridad": t.PRIORIDAD,
            "asunto": t.ASUNTO,
            "descripcion": t.DESCRIP,
            "categoria": cat.DESCRIP if cat else None,
            "id_categoria": t.ID_CATEGORIA,
            "subcategoria": subcat.DESCRIP if subcat else None,
            "id_subcategoria": t.ID_SUBCATEGORIA,
            "nombre_creador": nombre,
            "foto_creador": foto_persona,
            "id_personal": t.ID_PERSONAL,
            "id_ti": t.ID_TI,
            "tecnico": tecnico_nombre,
            "fech_creacion": str(t.FECH_CREACION) if t.FECH_CREACION else None,
            "fech_cierre": str(t.FECH_CIERRE) if t.FECH_CIERRE else None,
            "mensaje_ti": t.MENSAJE_TI,
            "valoracion": t.VALORACION,
            "foto": t.FOTO,
            "equipo": equipos_map.get(t.ID_PERSONAL),
            "es_sap": es_sap,
            "sap_data": sap_map.get(t.ID_TICKET),
        })

    return resultado


@router.get("/tickets/{id_ticket}")
def detalle_ticket(id_ticket: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Ticket:
        raise HTTPException(status_code=404, detail="Módulo de tickets no disponible")
    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return _serializar_ticket(db, t)


@router.post("/tickets")
async def crear_ticket(
    asunto: str = Form(...),
    id_categoria: int = Form(...),
    id_subcategoria: Optional[int] = Form(None),
    prioridad: str = Form("MEDIA"),
    descripcion: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cualquier usuario puede crear un ticket."""
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo de tickets no disponible")

    id_accs = token.get("id_accs")
    persona = _personal_por_accs(db, id_accs)
    if not persona:
        raise HTTPException(status_code=404, detail="Personal no encontrado para este usuario")

    # Guardar foto si viene
    nombre_foto = None
    if foto and foto.filename:
        ext = Path(foto.filename).suffix
        nombre_foto = f"ticket_{persona.ID_PERSONAL}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}"
        ruta_foto = UPLOAD_DIR / nombre_foto
        contenido = await foto.read()
        ruta_foto.write_bytes(contenido)

    nuevo = Ticket(
        ESTADO="ABIERTO",
        ID_PERSONAL=persona.ID_PERSONAL,
        PRIORIDAD=prioridad.upper(),
        ID_CATEGORIA=id_categoria,
        ID_SUBCATEGORIA=id_subcategoria,
        ASUNTO=asunto,
        DESCRIP=descripcion,
        FECH_CREACION=datetime.now(),
        FOTO=nombre_foto,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="CREAR",
        modulo="TICKETS",
        id_afectado=nuevo.ID_TICKET,
        nombre_afectado=asunto,
        datos_nuevos={"prioridad": prioridad, "categoria": id_categoria},
    )

    # Determinar roles destino según la categoría del ticket
    if id_categoria == ID_CATEGORIA_RRHH:
        # Tickets RRHH → solo notificar al rol RRHH (4)
        roles_notif = [ID_ROL_RRHH]
    else:
        # Tickets normales → notificar a SOPORTE (2) y ADMINISTRADOR (1)
        roles_notif = [1, 2]

    nombre_creador = f"{persona.NOMBRES} {persona.APE_PATERNO}" if persona else "Usuario"
    await _notificar_ticket(
        db, nuevo.ID_TICKET,
        tipo="ticket_creado",
        texto=f"Nuevo ticket: {asunto} — {nombre_creador} [{prioridad.upper()}]",
        roles_destino=roles_notif,
        id_empresa=token.get("id_emp"),
    )

    return {"mensaje": "Ticket creado exitosamente", "id_ticket": nuevo.ID_TICKET}


@router.post("/tickets/{id_ticket}/sap")
def guardar_datos_sap(
    id_ticket: int,
    datos: dict,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Guarda datos SAP extras vinculados a un ticket (artículo, servicio o socio de negocio).
       Acepta {"items": [{...}, ...]} con múltiples ítems o formato legacy {tipo, ...} con uno solo."""
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    # Soportar formato multi-item o legacy single-item
    items = datos.get("items") or [datos]

    for item in items:
        tipo = item.get("tipo")  # "articulo", "servicio", "socio"

        if tipo == "articulo" and SapArticulo:
            nuevo = SapArticulo()
            nuevo.ID_TICKET = id_ticket
            nuevo.ID_GRP_ART = item.get("id_grp_art")
            nuevo.ID_LISTA = item.get("id_lista", "NINGUNO")
            nuevo.ARTICULO_SAP = item.get("articulo_sap", "")
            nuevo.ID_FAMSAP = item.get("id_famsap")
            nuevo.ID_SBFAMSAP = item.get("id_sbfamsap")
            nuevo.ID_MARCASAP = item.get("id_marcasap")
            nuevo.MARCA_DESCRIP = item.get("marca_descrip")
            nuevo.ID_MODELOSAP = item.get("id_modelosap")
            nuevo.MODELO_DESCRIP = item.get("modelo_descrip")
            nuevo.ID_UNIDAD = item.get("id_unidad")
            nuevo.CODIGO_SAP = item.get("codigo_sap")
            db.add(nuevo)

        elif tipo == "servicio" and SapServicio:
            nuevo = SapServicio()
            nuevo.ID_TICKET = id_ticket
            nuevo.ID_GRP_ART = item.get("id_grp_art")
            nuevo.SERVICIO_SAP = item.get("servicio_sap", "")
            nuevo.ID_UNIDAD = item.get("id_unidad")
            nuevo.CODIGO_SAP = item.get("codigo_sap")
            db.add(nuevo)

        elif tipo == "socio" and SapSocioNegocio:
            nuevo = SapSocioNegocio()
            nuevo.ID_TICKET = id_ticket
            nuevo.ID_TSOCIO = item.get("id_tsocio")
            nuevo.RAZON_SOCIAL = item.get("razon_social", "")
            nuevo.RUC = item.get("ruc")
            nuevo.DIRECCION = item.get("direccion")
            nuevo.CODIGO_SAP = item.get("codigo_sap")
            db.add(nuevo)

        else:
            raise HTTPException(status_code=400, detail="Tipo SAP no válido")

    db.commit()
    return {"mensaje": "Datos SAP guardados correctamente", "items_guardados": len(items)}


@router.put("/tickets/{id_ticket}/sap/codigo")
async def actualizar_codigo_sap(
    id_ticket: int,
    datos: dict,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """TI actualiza los códigos SAP antes de cerrar el ticket.
       Acepta {"codigos": [{"id": X, "tipo": "articulo", "codigo_sap": "..."},  ...]}
       o formato legacy {"codigo_sap": "..."} para un solo item."""
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    codigos = datos.get("codigos")
    if codigos:
        # Multi-item update
        for c in codigos:
            tipo = c.get("tipo")
            item_id = c.get("id")
            codigo = c.get("codigo_sap", "")
            if tipo == "articulo" and SapArticulo and item_id:
                sa = db.query(SapArticulo).filter(SapArticulo.ID_SAP_ARTICULO == item_id).first()
                if sa:
                    sa.CODIGO_SAP = codigo
            elif tipo == "servicio" and SapServicio and item_id:
                ss = db.query(SapServicio).filter(SapServicio.ID_SAP_SERVICIO == item_id).first()
                if ss:
                    ss.CODIGO_SAP = codigo
            elif tipo == "socio" and SapSocioNegocio and item_id:
                sn = db.query(SapSocioNegocio).filter(SapSocioNegocio.ID_SAP_SOCIO == item_id).first()
                if sn:
                    sn.CODIGO_SAP = codigo
    else:
        # Legacy single-item update
        codigo_sap = datos.get("codigo_sap", "")
        actualizado = False
        if SapArticulo:
            sa = db.query(SapArticulo).filter(SapArticulo.ID_TICKET == id_ticket).first()
            if sa:
                sa.CODIGO_SAP = codigo_sap
                actualizado = True
        if not actualizado and SapServicio:
            ss = db.query(SapServicio).filter(SapServicio.ID_TICKET == id_ticket).first()
            if ss:
                ss.CODIGO_SAP = codigo_sap
                actualizado = True
        if not actualizado and SapSocioNegocio:
            sn = db.query(SapSocioNegocio).filter(SapSocioNegocio.ID_TICKET == id_ticket).first()
            if sn:
                sn.CODIGO_SAP = codigo_sap
                actualizado = True
        if not actualizado:
            raise HTTPException(status_code=404, detail="No se encontraron datos SAP para este ticket")

    db.commit()
    return {"mensaje": "Código(s) SAP actualizado(s)"}


@router.put("/tickets/{id_ticket}/asignar")
async def asignar_ticket(
    id_ticket: int,
    id_ti: int,
    mensaje_ti: Optional[str] = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Admin/Soporte o usuarios con permiso TICKETS_PANEL pueden asignar un técnico."""
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos para asignar tickets")
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo de tickets no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    t.ID_TI = id_ti
    if t.ESTADO == "ABIERTO":
        t.ESTADO = "ASIGNADO"
    if mensaje_ti:
        t.MENSAJE_TI = mensaje_ti
    db.commit()

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="ASIGNAR",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"id_ti": id_ti, "estado": t.ESTADO},
    )

    # Notificar al creador que su ticket fue asignado
    tec = db.query(Personal).filter(Personal.ID_PERSONAL == id_ti).first()
    nombre_tec = f"{tec.NOMBRES} {tec.APE_PATERNO}" if tec else "un técnico"
    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_estado",
        texto=f"Tu ticket fue asignado a {nombre_tec}: {t.ASUNTO}",
        destinatarios_ids=[t.ID_PERSONAL],
    )

    return {"mensaje": "Ticket asignado", "estado": t.ESTADO}


@router.put("/tickets/{id_ticket}/estado")
async def cambiar_estado(
    id_ticket: int,
    estado: str,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cambiar estado del ticket. Admin/Soporte o TICKETS_PANEL."""
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    estados_validos = ("ABIERTO", "ASIGNADO", "RESUELTO", "CERRADO")
    estado = estado.upper()
    if estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Válidos: {estados_validos}")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    t.ESTADO = estado
    if estado == "CERRADO":
        t.FECH_CIERRE = datetime.now()
    db.commit()

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="CAMBIAR_ESTADO",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"estado": estado},
    )

    # Notificar al creador del ticket sobre el cambio de estado
    etiquetas = {"ASIGNADO": "asignado", "RESUELTO": "en progreso", "CERRADO": "cerrado"}
    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_estado",
        texto=f"Tu ticket ahora está {etiquetas.get(estado, estado)}: {t.ASUNTO}",
        destinatarios_ids=[t.ID_PERSONAL],
    )

    return {"mensaje": f"Estado actualizado a {estado}"}


@router.put("/tickets/{id_ticket}/prioridad")
async def cambiar_prioridad(
    id_ticket: int,
    prioridad: str,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cambiar prioridad del ticket. Admin/Soporte o TICKETS_PANEL."""
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    prioridades_validas = ("BAJA", "MEDIA", "ALTA", "URGENTE")
    prioridad = prioridad.upper()
    if prioridad not in prioridades_validas:
        raise HTTPException(status_code=400, detail=f"Prioridad inválida. Válidas: {prioridades_validas}")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    anterior = t.PRIORIDAD
    t.PRIORIDAD = prioridad
    db.commit()

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="CAMBIAR_PRIORIDAD",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"prioridad": prioridad, "prioridad_anterior": anterior},
    )

    # Notificar al creador del ticket sobre el cambio de prioridad
    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_estado",
        texto=f"La prioridad de tu ticket fue cambiada a {prioridad}: {t.ASUNTO}",
        destinatarios_ids=[t.ID_PERSONAL],
    )

    return {"mensaje": f"Prioridad actualizada a {prioridad}"}


@router.put("/tickets/{id_ticket}/cerrar")
async def cerrar_ticket(
    id_ticket: int,
    mensaje_ti: Optional[str] = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cerrar ticket con comentario opcional. Admin/Soporte o TICKETS_PANEL."""
    if not _tiene_panel_tickets(token, db):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    t.ESTADO = "CERRADO"
    t.FECH_CIERRE = datetime.now()
    if mensaje_ti:
        t.MENSAJE_TI = mensaje_ti
    db.commit()

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="CERRAR",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"mensaje_ti": mensaje_ti},
    )

    # Notificar al creador que su ticket fue cerrado
    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_estado",
        texto=f"Tu ticket fue cerrado: {t.ASUNTO}" + (f" — {mensaje_ti}" if mensaje_ti else ""),
        destinatarios_ids=[t.ID_PERSONAL],
    )

    return {"mensaje": "Ticket cerrado exitosamente"}


@router.put("/tickets/{id_ticket}/valorar")
async def valorar_ticket(
    id_ticket: int,
    valoracion: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """El usuario creador puede valorar un ticket cerrado."""
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    if t.ESTADO != "CERRADO":
        raise HTTPException(status_code=400, detail="Solo se pueden valorar tickets cerrados")

    if valoracion < 1 or valoracion > 3:
        raise HTTPException(status_code=400, detail="La valoración debe estar entre 1 y 3")

    t.VALORACION = valoracion
    db.commit()

    return {"mensaje": "Valoración registrada"}


@router.put("/tickets/{id_ticket}/reabrir")
async def reabrir_ticket(
    id_ticket: int,
    motivo: Optional[str] = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """El usuario creador puede reabrir un ticket cerrado (en lugar de valorar)."""
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    if t.ESTADO != "CERRADO":
        raise HTTPException(status_code=400, detail="Solo se pueden reabrir tickets cerrados")

    t.ESTADO = "ABIERTO"
    t.VALORACION = None
    t.FECH_CIERRE = None
    t.MENSAJE_TI = None
    db.commit()

    motivo_texto = motivo.strip() if motivo else None

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="REABRIR",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"estado": "ABIERTO", "motivo": motivo_texto},
    )

    # Notificar a SOPORTE y ADMIN que el ticket fue reabierto
    id_empresa = token.get("id_emp")
    id_accs = token.get("id_accs")
    personal_reabrio = _personal_por_accs(db, id_accs)
    nombre_reabrio = f"{personal_reabrio.NOMBRES} {personal_reabrio.APE_PATERNO}" if personal_reabrio else "Usuario"

    texto_notif = f"Ticket reabierto: {t.ASUNTO}"
    if motivo_texto:
        texto_notif += f" — Motivo: {motivo_texto}"

    # Incluir al técnico asignado (ID_TI) para que vea el motivo
    destinatarios_extra = []
    if t.ID_TI:
        destinatarios_extra.append(t.ID_TI)

    # Notificación general (campana) según categoría del ticket
    if t.ID_CATEGORIA == ID_CATEGORIA_RRHH:
        # Tickets RRHH → solo notificar al rol RRHH
        roles_reabrir = [ID_ROL_RRHH]
    else:
        roles_reabrir = [1, 2]

    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_reabierto",
        texto=texto_notif,
        destinatarios_ids=destinatarios_extra,
        roles_destino=roles_reabrir,
        id_empresa=id_empresa,
    )

    # Notificación especial para modal de reapertura (al técnico asignado)
    if t.ID_TI:
        await coleccion_notif_tickets.insert_one({
            "id_personal": t.ID_TI,
            "id_ticket": id_ticket,
            "tipo": "ticket_reabierto_modal",
            "texto": texto_notif,
            "asunto": t.ASUNTO,
            "motivo": motivo_texto or "",
            "nombre_reabrio": nombre_reabrio,
            "leido": False,
            "fecha": datetime.now(),
        })

    return {"mensaje": "Ticket reabierto exitosamente"}
