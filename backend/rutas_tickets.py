# ============================================
# RUTAS TICKETS — Sistema de tickets de soporte TI
# Responsabilidad: CRUD de tickets, asignación, cambio de estado,
# listado por rol, categorías y subcategorías.
# Roles: ADMINISTRADOR y SOPORTE ven todos; USUARIO solo los propios.
# ============================================

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path

from database import (
    get_db, Ticket, CategoriaTicket, SubcategoriaTicket,
    Personal, Acceso, Contrato, Cargo, Equipo, AsignacionEquipo, TipoEquipo,
    EspecificacionesTec,
    FamiliaSap, SubfamiliaSap, MarcaSap, ModeloSap,
    GrupoArticulos, TipoUnidad, TipoSocioNegocio,
    SapArticulo, SapServicio, SapSocioNegocio,
)
from auth_token import verificar_token
from auditoria import registrar_accion
from mongodb import coleccion_notif_tickets

router = APIRouter()

ROLES_TI = ("ADMINISTRADOR", "ADMIN", "SOPORTE")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "erp-poo" / "public" / "assets" / "tickets"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ── Helpers ──────────────────────────────────────

def _rol_token(token: dict) -> str:
    return (token.get("rol") or "").strip().upper()


def _es_ti(token: dict) -> bool:
    return _rol_token(token) in ROLES_TI


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

    if roles_destino and id_empresa:
        personas_rol = (
            db.query(Personal)
            .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
            .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(
                Acceso.ID_ESTADO == 1,
                Acceso.ID_ROL.in_(roles_destino),
                Cargo.ID_EMP == id_empresa,
                Contrato.ID_ESTADO_CONTRATO == 1,
            )
            .all()
        )
        for p in personas_rol:
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

    # SAP data
    es_sap = False
    sap_data = None
    if cat and cat.DESCRIP and cat.DESCRIP.upper() == 'SAP':
        es_sap = True
        if SapArticulo:
            sa = db.query(SapArticulo).filter(SapArticulo.ID_TICKET == t.ID_TICKET).first()
            if sa:
                sap_data = {"tipo": "articulo", "codigo_sap": sa.CODIGO_SAP}
        if not sap_data and SapServicio:
            ss = db.query(SapServicio).filter(SapServicio.ID_TICKET == t.ID_TICKET).first()
            if ss:
                sap_data = {"tipo": "servicio", "codigo_sap": ss.CODIGO_SAP}
        if not sap_data and SapSocioNegocio:
            sn = db.query(SapSocioNegocio).filter(SapSocioNegocio.ID_TICKET == t.ID_TICKET).first()
            if sn:
                sap_data = {"tipo": "socio", "codigo_sap": sn.CODIGO_SAP}

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
    """Lista empleados con rol SOPORTE de cualquier empresa (posibles asignados)."""
    tecnicos = (
        db.query(Personal, Acceso)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Acceso.ID_ESTADO == 1,
            Acceso.ID_ROL == 2,  # Solo SOPORTE
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .all()
    )
    return [
        {"id_personal": p.ID_PERSONAL, "nombre": f"{p.NOMBRES} {p.APE_PATERNO}"}
        for p, a in tecnicos
    ]


# ── Estadísticas (dashboard) ─────────────────────

@router.get("/tickets/estadisticas")
def estadisticas_tickets(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not _es_ti(token):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if not Ticket:
        return {"abiertos": 0, "asignados": 0, "en_progreso": 0, "cerrados": 0, "total": 0, "por_mes": []}

    # ADMIN/SOPORTE ven estadísticas de TODAS las empresas
    # Conteos por estado
    conteos = (
        db.query(
            Ticket.ESTADO,
            func.count(Ticket.ID_TICKET),
        )
        .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(Contrato.ID_ESTADO_CONTRATO == 1)
        .group_by(Ticket.ESTADO)
        .all()
    )
    mapa = {estado: cant for estado, cant in conteos}

    # Tickets por mes (últimos 6 meses)
    por_mes = (
        db.query(
            func.month(Ticket.FECH_CREACION).label("mes"),
            func.count(Ticket.ID_TICKET),
        )
        .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(Contrato.ID_ESTADO_CONTRATO == 1)
        .group_by(func.month(Ticket.FECH_CREACION))
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


# ── CRUD Tickets ─────────────────────────────────

@router.get("/tickets")
def listar_tickets(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    """Admin/Soporte ven todos los tickets de TODAS las empresas; Usuario solo los propios de su empresa."""
    if not Ticket:
        return []

    id_empresa = token.get("id_emp")
    id_accs = token.get("id_accs")
    es_ti = _es_ti(token)

    if es_ti:
        # ADMIN/SOPORTE ven tickets de TODAS las empresas
        query = (
            db.query(Ticket)
            .join(Personal, Personal.ID_PERSONAL == Ticket.ID_PERSONAL)
            .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
            .filter(Contrato.ID_ESTADO_CONTRATO == 1)
        )
    else:
        # Usuarios normales solo ven sus propios tickets de su empresa
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

    tickets = query.order_by(Ticket.FECH_CREACION.desc()).all()
    return [_serializar_ticket(db, t) for t in tickets]


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

    # Notificar a SOPORTE (2) y ADMINISTRADOR (1) sobre nuevo ticket
    nombre_creador = f"{persona.NOMBRES} {persona.APE_PATERNO}" if persona else "Usuario"
    await _notificar_ticket(
        db, nuevo.ID_TICKET,
        tipo="ticket_creado",
        texto=f"Nuevo ticket #{nuevo.ID_TICKET}: {asunto} — {nombre_creador} [{prioridad.upper()}]",
        roles_destino=[1, 2],
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
    """Guarda datos SAP extras vinculados a un ticket (artículo, servicio o socio de negocio)."""
    if not Ticket:
        raise HTTPException(status_code=500, detail="Módulo no disponible")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    tipo = datos.get("tipo")  # "articulo", "servicio", "socio"

    if tipo == "articulo" and SapArticulo:
        nuevo = SapArticulo()
        nuevo.ID_TICKET = id_ticket
        nuevo.ID_GRP_ART = datos.get("id_grp_art")
        nuevo.ID_LISTA = datos.get("id_lista", "NINGUNO")
        nuevo.ARTICULO_SAP = datos.get("articulo_sap", "")
        nuevo.ID_FAMSAP = datos.get("id_famsap")
        nuevo.ID_SBFAMSAP = datos.get("id_sbfamsap")
        nuevo.ID_MARCASAP = datos.get("id_marcasap")
        nuevo.MARCA_DESCRIP = datos.get("marca_descrip")
        nuevo.ID_MODELOSAP = datos.get("id_modelosap")
        nuevo.MODELO_DESCRIP = datos.get("modelo_descrip")
        nuevo.ID_UNIDAD = datos.get("id_unidad")
        nuevo.CODIGO_SAP = datos.get("codigo_sap")
        db.add(nuevo)

    elif tipo == "servicio" and SapServicio:
        nuevo = SapServicio()
        nuevo.ID_TICKET = id_ticket
        nuevo.ID_GRP_ART = datos.get("id_grp_art")
        nuevo.SERVICIO_SAP = datos.get("servicio_sap", "")
        nuevo.ID_UNIDAD = datos.get("id_unidad")
        nuevo.CODIGO_SAP = datos.get("codigo_sap")
        db.add(nuevo)

    elif tipo == "socio" and SapSocioNegocio:
        nuevo = SapSocioNegocio()
        nuevo.ID_TICKET = id_ticket
        nuevo.ID_TSOCIO = datos.get("id_tsocio")
        nuevo.RAZON_SOCIAL = datos.get("razon_social", "")
        nuevo.RUC = datos.get("ruc")
        nuevo.DIRECCION = datos.get("direccion")
        nuevo.CODIGO_SAP = datos.get("codigo_sap")
        db.add(nuevo)

    else:
        raise HTTPException(status_code=400, detail="Tipo SAP no válido")

    db.commit()
    return {"mensaje": "Datos SAP guardados correctamente"}


@router.put("/tickets/{id_ticket}/sap/codigo")
async def actualizar_codigo_sap(
    id_ticket: int,
    codigo_sap: str,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """TI actualiza el código SAP antes de cerrar el ticket."""
    if not _es_ti(token):
        raise HTTPException(status_code=403, detail="Sin permisos")

    t = db.query(Ticket).filter(Ticket.ID_TICKET == id_ticket).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

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
    return {"mensaje": "Código SAP actualizado"}


@router.put("/tickets/{id_ticket}/asignar")
async def asignar_ticket(
    id_ticket: int,
    id_ti: int,
    mensaje_ti: Optional[str] = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Solo Admin/Soporte pueden asignar un técnico."""
    if not _es_ti(token):
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
        texto=f"Tu ticket #{id_ticket} fue asignado a {nombre_tec}",
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
    """Cambiar estado del ticket. Solo Admin/Soporte."""
    if not _es_ti(token):
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
        texto=f"Tu ticket #{id_ticket} ahora está {etiquetas.get(estado, estado)}",
        destinatarios_ids=[t.ID_PERSONAL],
    )

    return {"mensaje": f"Estado actualizado a {estado}"}


@router.put("/tickets/{id_ticket}/cerrar")
async def cerrar_ticket(
    id_ticket: int,
    mensaje_ti: Optional[str] = None,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """Cerrar ticket con comentario opcional. Solo Admin/Soporte."""
    if not _es_ti(token):
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
        texto=f"Tu ticket #{id_ticket} fue cerrado" + (f": {mensaje_ti}" if mensaje_ti else ""),
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

    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="REABRIR",
        modulo="TICKETS",
        id_afectado=id_ticket,
        nombre_afectado=t.ASUNTO,
        datos_nuevos={"estado": "ABIERTO"},
    )

    # Notificar a SOPORTE y ADMIN que el ticket fue reabierto
    id_empresa = token.get("id_emp")
    await _notificar_ticket(
        db, id_ticket,
        tipo="ticket_creado",
        texto=f"Ticket #{id_ticket} fue reabierto: {t.ASUNTO}",
        roles_destino=[1, 2],
        id_empresa=id_empresa,
    )

    return {"mensaje": "Ticket reabierto exitosamente"}
