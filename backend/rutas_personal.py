# ============================================
# RUTAS PERSONAL — CRUD completo de empleados
# Responsabilidad: alta, baja, edición, consulta de personal,
# contactos, seguros, cuentas bancarias y foto de perfil.
# Los catálogos (áreas, cargos, etc.) están en rutas_catalogos.py
# ============================================

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from collections import defaultdict
import re
from database import (
    get_db, Personal, Contrato, Contacto, Acceso,
    Area, Cargo, Documento, EstadoAccs, EstadoContrato,
    Departamento, TipoContrato, EstadoCivil,
    GradoAcademico, Distrito, TipoFamiliar,
    SegurosAportaciones, AFP, CuentaBanca,
    Banco, Moneda, TipoCuenta, Modalidad,
    Horario, AsignacionEmp
)
from helpers import construir_rangos_horarios
from auth_token import verificar_token
from auditoria import registrar_accion

router = APIRouter()

# === ESQUEMA: todos los campos del empleado según SQL ===
class PersonalSchema(BaseModel):
    nombres: str
    ape_paterno: str
    ape_materno: str
    genero: str
    num_doc: str
    id_doc: Optional[int] = 1
    fech_nac: Optional[str] = None
    email: Optional[str] = None
    celular: Optional[str] = None
    id_area: int = 1
    id_cargo: int = 1
    id_tipocontr: int = 1
    id_modalidad: Optional[int] = None
    direccion: Optional[str] = None
    sueldo: Optional[str] = None
    asig_fam: Optional[int] = 0
    fech_ingr: Optional[str] = None
    fech_cese: Optional[str] = None
    id_estcivil: Optional[int] = None
    id_acadm: Optional[int] = None
    id_distr: Optional[int] = None

# === LISTAR PERSONAL (optimizado: consultas por lote en vez de N+1) ===
@router.get("/personal")
async def listar_personal(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    # Pre-cargar todos los catálogos en diccionarios (1 query cada uno)
    areas_map = {a.ID_AREA: a.DESCRIP for a in db.query(Area).all()}
    cargos_map = {c.ID_CARGO: (c.DESCRIP, c.ID_DEPART) for c in db.query(Cargo).all()}
    docs_map = {d.ID_DOC: d.CODIGO for d in db.query(Documento).all()}
    depart_map = {d.ID_DEPART: d.DESCRIP for d in db.query(Departamento).all()}
    tipos_contr_map = {t.ID_TIPOCONTR: t.DESCRIP for t in db.query(TipoContrato).all()}
    est_civil_map = {e.ID_ESTCIVIL: e.DESCRIP for e in db.query(EstadoCivil).all()}
    grados_map = {g.ID_ACADM: g.DESCRIP for g in db.query(GradoAcademico).all()}
    distritos_map = {d.ID_DISTR: d.DESCRIP for d in db.query(Distrito).all()}
    estados_map = {e.ID_ESTADO: e.DESCRIP for e in db.query(EstadoAccs).all()}
    tipo_fam_map = {t.ID_TIPFAM: t.DESCRIP for t in db.query(TipoFamiliar).all()}
    modalidad_map = {}
    if Modalidad:
        modalidad_map = {m.ID_MODALID: m.DESCRIP for m in db.query(Modalidad).all()}

    horarios_map = {}
    horarios_descrip_map = {}
    if Horario:
        for h in db.query(Horario).all():
            horarios_map[h.ID_HORARIO] = h.NOMBRE
            horarios_descrip_map[h.ID_HORARIO] = h.DESCRIP or ''
    horarios_rangos = construir_rangos_horarios(db)

    # Consulta principal con JOINs (1 sola query) — filtrada por empresa del token
    id_empresa = token.get("id_emp")
    registros = db.query(Personal, Contrato, Acceso).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).outerjoin(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).outerjoin(
        Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
    ).filter(
        Cargo.ID_EMP == id_empresa,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).all()

    # IDs de personal en esta empresa (para filtrar contactos)
    personal_ids = [p.ID_PERSONAL for p, _, _ in registros]

    # Contactos filtrados por personal de la empresa (1 sola query)
    contactos_map = defaultdict(list)
    if personal_ids:
        for c in db.query(Contacto).filter(Contacto.ID_PERSONAL.in_(personal_ids)).all():
            contactos_map[c.ID_PERSONAL].append({
                "nombre": c.NOMBRES, "celular": c.CELULAR,
                "id_tipfam": c.ID_TIPFAM,
                "tipo_familiar": tipo_fam_map.get(c.ID_TIPFAM)
            })

    resultado = []
    for p, contrato, acceso in registros:
        doc_codigo = docs_map.get(p.ID_DOC)
        estado_nombre = estados_map.get(acceso.ID_ESTADO) if acceso else None

        area_nombre = None; id_area = None
        cargo_nombre = None; id_cargo = None; id_depart = None
        depart_nombre = None; tipo_contr_nombre = None; id_tipocontr = None
        modal_nombre = None; id_modalidad = None
        direccion = None; sueldo = None; asig_fam = 0
        fech_ingr = None; fech_cese = None
        id_estcivil = None; est_civil_nombre = None
        id_acadm = None; grado_nombre = None
        id_distr = None; distrito_nombre = None

        # Atributos personales (ahora viven en personal, no en contrato)
        id_estcivil = getattr(p, 'ID_ESTCIVIL', None)
        if id_estcivil:
            est_civil_nombre = est_civil_map.get(id_estcivil)
        id_acadm = getattr(p, 'ID_ACADM', None)
        if id_acadm:
            grado_nombre = grados_map.get(id_acadm)
        id_distr = getattr(p, 'ID_DISTR', None)
        if id_distr:
            distrito_nombre = distritos_map.get(id_distr)
        direccion = getattr(p, 'DIRECCION', None)

        if contrato:
            id_area = contrato.ID_AREA
            area_nombre = areas_map.get(id_area)
            id_cargo = contrato.ID_CARGO
            cargo_info = cargos_map.get(id_cargo, (None, None))
            cargo_nombre = cargo_info[0]
            id_depart = cargo_info[1]
            depart_nombre = depart_map.get(id_depart)
            id_tipocontr = contrato.ID_TIPOCONTR
            tipo_contr_nombre = tipos_contr_map.get(id_tipocontr)
            id_modalidad = getattr(contrato, 'ID_MODALID', None)
            if id_modalidad:
                modal_nombre = modalidad_map.get(id_modalidad)
            sueldo = contrato.SUELDO
            asig_fam = contrato.ASIG_FAM if contrato.ASIG_FAM else 0
            fech_ingr = str(contrato.FECH_INGR) if contrato.FECH_INGR else None
            fech_cese = str(contrato.FECH_CESE) if contrato.FECH_CESE else None

        resultado.append({
            "id": p.ID_PERSONAL,
            "nombres": p.NOMBRES, "ape_paterno": p.APE_PATERNO, "ape_materno": p.APE_MATERNO,
            "genero": "M" if p.GENERO_PERS == 1 else "F",
            "num_doc": p.NUM_DOC, "id_doc": p.ID_DOC,
            "tipo_doc": doc_codigo,
            "fech_nac": str(p.FECH_NAC) if p.FECH_NAC else None,
            "email": p.EMAIL, "celular": p.CELULAR, "foto": p.FOTO,
            "estado": estado_nombre,
            "area": area_nombre, "id_area": id_area,
            "departamento": depart_nombre, "id_depart": id_depart,
            "cargo": cargo_nombre, "id_cargo": id_cargo,
            "tipo_contrato": tipo_contr_nombre, "id_tipocontr": id_tipocontr,
            "modalidad": modal_nombre, "id_modalidad": id_modalidad,
            "direccion": direccion, "sueldo": sueldo, "asig_fam": asig_fam,
            "fech_ingreso": fech_ingr, "fech_cese": fech_cese,
            "estado_civil": est_civil_nombre, "id_estcivil": id_estcivil,
            "grado_academico": grado_nombre, "id_acadm": id_acadm,
            "distrito": distrito_nombre, "id_distr": id_distr,
            "contactos": contactos_map.get(p.ID_PERSONAL, []),
            "id_horario": getattr(contrato, 'ID_HORARIO', None) if contrato else None,
            "horario_nombre": horarios_map.get(getattr(contrato, 'ID_HORARIO', None), "Sin horario") if contrato else "Sin horario",
            "horario_descrip": horarios_descrip_map.get(getattr(contrato, 'ID_HORARIO', None), "") if contrato else "",
            "horario_rango": horarios_rangos.get(getattr(contrato, 'ID_HORARIO', None), "") if contrato else "",
        })
    return resultado


# === MI PERFIL — datos del empleado autenticado (accesible para TODOS los roles) ===
@router.get("/mi-perfil")
async def mi_perfil(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    id_accs = token.get("id_accs")
    if not id_accs:
        raise HTTPException(status_code=400, detail="Token sin id_accs")

    # Buscar el personal asociado a este acceso
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    if not personal:
        raise HTTPException(status_code=404, detail="No se encontró personal asociado a esta cuenta")

    id_personal = personal.ID_PERSONAL

    # Pre-cargar catálogos
    areas_map = {a.ID_AREA: a.DESCRIP for a in db.query(Area).all()}
    cargos_map = {c.ID_CARGO: (c.DESCRIP, c.ID_DEPART) for c in db.query(Cargo).all()}
    docs_map = {d.ID_DOC: d.CODIGO for d in db.query(Documento).all()}
    depart_map = {d.ID_DEPART: d.DESCRIP for d in db.query(Departamento).all()}
    tipos_contr_map = {t.ID_TIPOCONTR: t.DESCRIP for t in db.query(TipoContrato).all()}
    est_civil_map = {e.ID_ESTCIVIL: e.DESCRIP for e in db.query(EstadoCivil).all()}
    grados_map = {g.ID_ACADM: g.DESCRIP for g in db.query(GradoAcademico).all()}
    distritos_map = {d.ID_DISTR: d.DESCRIP for d in db.query(Distrito).all()}
    estados_map = {e.ID_ESTADO: e.DESCRIP for e in db.query(EstadoAccs).all()}
    tipo_fam_map = {t.ID_TIPFAM: t.DESCRIP for t in db.query(TipoFamiliar).all()}
    modalidad_map = {}
    if Modalidad:
        modalidad_map = {m.ID_MODALID: m.DESCRIP for m in db.query(Modalidad).all()}

    horarios_map = {}
    horarios_descrip_map = {}
    if Horario:
        for h in db.query(Horario).all():
            horarios_map[h.ID_HORARIO] = h.NOMBRE
            horarios_descrip_map[h.ID_HORARIO] = h.DESCRIP or ''
    horarios_rangos = construir_rangos_horarios(db)

    # Consulta con JOIN
    registro = db.query(Personal, Contrato, Acceso).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).outerjoin(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).filter(
        Personal.ID_PERSONAL == id_personal,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).first()

    if not registro:
        raise HTTPException(status_code=404, detail="No se encontró contrato activo para este empleado")

    p, contrato, acceso = registro

    # Contactos
    contactos_raw = db.query(Contacto).filter(Contacto.ID_PERSONAL == id_personal).all()
    contactos_lista = [{
        "nombre": c.NOMBRES, "celular": c.CELULAR,
        "id_tipfam": c.ID_TIPFAM,
        "tipo_familiar": tipo_fam_map.get(c.ID_TIPFAM)
    } for c in contactos_raw]

    doc_codigo = docs_map.get(p.ID_DOC)
    estado_nombre = estados_map.get(acceso.ID_ESTADO) if acceso else None

    area_nombre = None; id_area = None
    cargo_nombre = None; id_cargo = None; id_depart = None
    depart_nombre = None; tipo_contr_nombre = None; id_tipocontr = None
    modal_nombre = None; id_modalidad = None
    direccion = None; sueldo = None; asig_fam = 0
    fech_ingr = None; fech_cese = None
    id_estcivil = None; est_civil_nombre = None
    id_acadm = None; grado_nombre = None
    id_distr = None; distrito_nombre = None

    id_estcivil = getattr(p, 'ID_ESTCIVIL', None)
    if id_estcivil:
        est_civil_nombre = est_civil_map.get(id_estcivil)
    id_acadm = getattr(p, 'ID_ACADM', None)
    if id_acadm:
        grado_nombre = grados_map.get(id_acadm)
    id_distr = getattr(p, 'ID_DISTR', None)
    if id_distr:
        distrito_nombre = distritos_map.get(id_distr)
    direccion = getattr(p, 'DIRECCION', None)

    if contrato:
        id_area = contrato.ID_AREA
        area_nombre = areas_map.get(id_area)
        id_cargo = contrato.ID_CARGO
        cargo_info = cargos_map.get(id_cargo, (None, None))
        cargo_nombre = cargo_info[0]
        id_depart = cargo_info[1]
        depart_nombre = depart_map.get(id_depart)
        id_tipocontr = contrato.ID_TIPOCONTR
        tipo_contr_nombre = tipos_contr_map.get(id_tipocontr)
        id_modalidad = getattr(contrato, 'ID_MODALID', None)
        if id_modalidad:
            modal_nombre = modalidad_map.get(id_modalidad)
        sueldo = contrato.SUELDO
        asig_fam = contrato.ASIG_FAM if contrato.ASIG_FAM else 0
        fech_ingr = str(contrato.FECH_INGR) if contrato.FECH_INGR else None
        fech_cese = str(contrato.FECH_CESE) if contrato.FECH_CESE else None

    return {
        "id": p.ID_PERSONAL,
        "nombres": p.NOMBRES, "ape_paterno": p.APE_PATERNO, "ape_materno": p.APE_MATERNO,
        "genero": "M" if p.GENERO_PERS == 1 else "F",
        "num_doc": p.NUM_DOC, "id_doc": p.ID_DOC,
        "tipo_doc": doc_codigo,
        "fech_nac": str(p.FECH_NAC) if p.FECH_NAC else None,
        "email": p.EMAIL, "celular": p.CELULAR, "foto": p.FOTO,
        "estado": estado_nombre,
        "area": area_nombre, "id_area": id_area,
        "departamento": depart_nombre, "id_depart": id_depart,
        "cargo": cargo_nombre, "id_cargo": id_cargo,
        "tipo_contrato": tipo_contr_nombre, "id_tipocontr": id_tipocontr,
        "modalidad": modal_nombre, "id_modalidad": id_modalidad,
        "direccion": direccion, "sueldo": sueldo, "asig_fam": asig_fam,
        "fech_ingreso": fech_ingr, "fech_cese": fech_cese,
        "estado_civil": est_civil_nombre, "id_estcivil": id_estcivil,
        "grado_academico": grado_nombre, "id_acadm": id_acadm,
        "distrito": distrito_nombre, "id_distr": id_distr,
        "contactos": contactos_lista,
        "id_horario": getattr(contrato, 'ID_HORARIO', None) if contrato else None,
        "horario_nombre": horarios_map.get(getattr(contrato, 'ID_HORARIO', None), "Sin horario") if contrato else "Sin horario",
        "horario_descrip": horarios_descrip_map.get(getattr(contrato, 'ID_HORARIO', None), "") if contrato else "",
        "horario_rango": horarios_rangos.get(getattr(contrato, 'ID_HORARIO', None), "") if contrato else "",
    }


@router.post("/personal")
async def crear_personal(datos: PersonalSchema, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    # Validar campos obligatorios con mensaje claro
    faltantes = []
    if not datos.nombres or not datos.nombres.strip(): faltantes.append('Nombres')
    if not datos.ape_paterno or not datos.ape_paterno.strip(): faltantes.append('Apellido Paterno')
    if not datos.ape_materno or not datos.ape_materno.strip(): faltantes.append('Apellido Materno')
    if not datos.num_doc or not datos.num_doc.strip(): faltantes.append('N° Documento')
    if faltantes:
        raise HTTPException(status_code=400, detail='Campos obligatorios faltantes: ' + ', '.join(faltantes))
    try:
        # Obtener id_empresa del token
        id_emp = token.get('id_emp', 1)
        usuario_base = (datos.nombres[0] + datos.ape_paterno).upper()
        usuario = usuario_base
        contador = 1
        while db.query(Acceso).filter(Acceso.USUARIO == usuario).first():
            usuario = usuario_base + str(contador)
            contador += 1
        nuevo_acceso = Acceso(USUARIO=usuario, PASSWORD=datos.num_doc, RESET_PASS=1, INTENT_LOGIN=0, ID_ESTADO=1, ID_ROL=3)
        db.add(nuevo_acceso); db.flush()
        # Asignar empresa al usuario via asignacion_emp
        if AsignacionEmp:
            asig = AsignacionEmp(ID_ACCS=nuevo_acceso.ID_ACCS, ID_EMP=id_emp)
            db.add(asig)
        nuevo = Personal(ID_ACCS=nuevo_acceso.ID_ACCS, NOMBRES=datos.nombres, APE_PATERNO=datos.ape_paterno, APE_MATERNO=datos.ape_materno, GENERO_PERS=1 if datos.genero=="M" else 2, NUM_DOC=datos.num_doc, ID_DOC=datos.id_doc, FECH_NAC=datos.fech_nac, EMAIL=datos.email, CELULAR=datos.celular, ID_ESTCIVIL=datos.id_estcivil, ID_ACADM=datos.id_acadm, ID_DISTR=datos.id_distr, DIRECCION=datos.direccion)
        db.add(nuevo); db.flush()
        contrato = Contrato(ID_PERSONAL=nuevo.ID_PERSONAL, ID_ESTADO_CONTRATO=1, ID_TIPOCONTR=datos.id_tipocontr, ID_MODALID=datos.id_modalidad, ID_AREA=datos.id_area, ID_CARGO=datos.id_cargo, SUELDO=datos.sueldo, ASIG_FAM=datos.asig_fam or 0, FECH_INGR=datos.fech_ingr, FECH_CESE=datos.fech_cese)
        db.add(contrato); db.commit()
        await registrar_accion(
            usuario=token.get("sub", "desconocido"),
            accion="CREAR",
            modulo="PERSONAL",
            id_afectado=nuevo.ID_PERSONAL,
            nombre_afectado=f"{datos.ape_paterno} {datos.ape_materno}, {datos.nombres}",
            datos_nuevos={"num_doc": datos.num_doc, "id_area": datos.id_area, "id_cargo": datos.id_cargo, "usuario": usuario}
        )
        return {"mensaje": "Empleado creado. Usuario: " + usuario, "id": nuevo.ID_PERSONAL}
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/personal/{id}")
async def actualizar_personal(id: int, datos: PersonalSchema, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    try:
        id_emp = token.get('id_emp', 1)
        persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
        if not persona: raise HTTPException(status_code=404, detail="Empleado no encontrado")
        persona.NOMBRES = datos.nombres; persona.APE_PATERNO = datos.ape_paterno; persona.APE_MATERNO = datos.ape_materno
        persona.GENERO_PERS = 1 if datos.genero=="M" else 2; persona.NUM_DOC = datos.num_doc; persona.ID_DOC = datos.id_doc
        persona.FECH_NAC = datos.fech_nac; persona.EMAIL = datos.email; persona.CELULAR = datos.celular
        persona.ID_ESTCIVIL = datos.id_estcivil; persona.ID_ACADM = datos.id_acadm
        persona.ID_DISTR = datos.id_distr; persona.DIRECCION = datos.direccion
        contrato = (
            db.query(Contrato)
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(Contrato.ID_PERSONAL == id, Cargo.ID_EMP == id_emp, Contrato.ID_ESTADO_CONTRATO == 1)
            .first()
        )
        if contrato:
            contrato.ID_TIPOCONTR = datos.id_tipocontr; contrato.ID_AREA = datos.id_area; contrato.ID_CARGO = datos.id_cargo
            contrato.ID_MODALID = datos.id_modalidad
            contrato.SUELDO = datos.sueldo; contrato.ASIG_FAM = datos.asig_fam or 0
            contrato.FECH_INGR = datos.fech_ingr; contrato.FECH_CESE = datos.fech_cese
        else:
            contrato = Contrato(ID_PERSONAL=id, ID_ESTADO_CONTRATO=1, ID_TIPOCONTR=datos.id_tipocontr, ID_MODALID=datos.id_modalidad, ID_AREA=datos.id_area, ID_CARGO=datos.id_cargo, SUELDO=datos.sueldo, ASIG_FAM=datos.asig_fam or 0, FECH_INGR=datos.fech_ingr, FECH_CESE=datos.fech_cese)
            db.add(contrato)
        db.commit()
        await registrar_accion(
            usuario=token.get("sub", "desconocido"),
            accion="EDITAR",
            modulo="PERSONAL",
            id_afectado=id,
            nombre_afectado=f"{datos.ape_paterno} {datos.ape_materno}, {datos.nombres}",
            datos_nuevos={"num_doc": datos.num_doc, "id_area": datos.id_area, "id_cargo": datos.id_cargo}
        )
        return {"mensaje": "Empleado actualizado"}
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/personal/{id}/desactivar")
async def desactivar_personal(id: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona: raise HTTPException(status_code=404, detail="Empleado no encontrado")
    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == persona.ID_ACCS).first()
    if not acceso: raise HTTPException(status_code=404, detail="Acceso no encontrado")
    if acceso.ID_ESTADO == 1:
        acceso.ID_ESTADO = 2; mensaje = "Empleado desactivado"
    else:
        acceso.ID_ESTADO = 1; mensaje = "Empleado reactivado"
    db.commit()
    await registrar_accion(
        usuario=token.get("sub", "desconocido"),
        accion="DESACTIVAR" if acceso.ID_ESTADO == 2 else "REACTIVAR",
        modulo="PERSONAL",
        id_afectado=id,
        nombre_afectado=f"{persona.APE_PATERNO} {persona.APE_MATERNO}, {persona.NOMBRES}",
        datos_nuevos={"estado": acceso.ID_ESTADO}
    )
    return {"mensaje": mensaje}

# === ESQUEMA: contactos de emergencia ===
class ContactoItem(BaseModel):
    nombre: str
    celular: str
    id_tipfam: Optional[int] = None

class ContactosSchema(BaseModel):
    contactos: List[ContactoItem]

# === ACTUALIZAR CONTACTOS DE EMERGENCIA ===
@router.put("/personal/{id}/contactos")
async def actualizar_contactos(id: int, datos: ContactosSchema, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    try:
        persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        # Eliminar contactos anteriores
        db.query(Contacto).filter(Contacto.ID_PERSONAL == id).delete()
        # Insertar los nuevos
        for c in datos.contactos:
            if c.nombre.strip() or c.celular.strip():
                nuevo = Contacto(ID_PERSONAL=id, NOMBRES=c.nombre.strip(), CELULAR=c.celular.strip(), ID_TIPFAM=c.id_tipfam or 7)
                db.add(nuevo)
        db.commit()
        return {"mensaje": "Contactos actualizados"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# === ESQUEMA: seguros y aportaciones ===
class SeguroAportacionSchema(BaseModel):
    id_afp: int
    cod_afp: str = ''
    comision_afp: int = 0
    aportacion: int = 0

# === OBTENER SEGUROS Y APORTACIONES ===
@router.get("/personal/{id}/seguros-aportaciones")
async def obtener_seguros(id: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    seguro = db.query(SegurosAportaciones).filter(SegurosAportaciones.ID_PERSONAL == id).first()
    if not seguro:
        return None
    afp = db.query(AFP).filter(AFP.ID_AFP == seguro.ID_AFP).first()
    return {
        "id": seguro.ID_SEGAPORT,
        "id_afp": seguro.ID_AFP,
        "afp": afp.DESCRIP if afp else None,
        "cod_afp": seguro.COD_AFP,
        "comision_afp": seguro.COMISION_AFP,
        "aportacion": seguro.APORTACION
    }

# === GUARDAR SEGUROS Y APORTACIONES ===
@router.put("/personal/{id}/seguros-aportaciones")
async def guardar_seguros(id: int, datos: SeguroAportacionSchema, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    try:
        persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        seguro = db.query(SegurosAportaciones).filter(SegurosAportaciones.ID_PERSONAL == id).first()
        if seguro:
            seguro.ID_AFP = datos.id_afp
            seguro.COD_AFP = datos.cod_afp
            seguro.COMISION_AFP = datos.comision_afp
            seguro.APORTACION = datos.aportacion
        else:
            seguro = SegurosAportaciones(
                ID_PERSONAL=id, ID_AFP=datos.id_afp,
                COD_AFP=datos.cod_afp, COMISION_AFP=datos.comision_afp,
                APORTACION=datos.aportacion
            )
            db.add(seguro)
        db.commit()
        return {"mensaje": "Seguros y aportaciones actualizados"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# === ESQUEMA: cuenta bancaria ===
class CuentaBancariaItem(BaseModel):
    id_tipo_cuenta: int
    id_banco: int
    cuenta_banc: Optional[str] = None
    id_moneda: int

class CuentasBancariasSchema(BaseModel):
    cuentas: List[CuentaBancariaItem]

# === OBTENER CUENTAS BANCARIAS ===
@router.get("/personal/{id}/cuentas-bancarias")
async def obtener_cuentas(id: int, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    cuentas = db.query(CuentaBanca).filter(CuentaBanca.ID_PERSONAL == id).all()
    resultado = []
    for c in cuentas:
        banco = db.query(Banco).filter(Banco.ID_BANCO == c.ID_BANCO).first()
        moneda = db.query(Moneda).filter(Moneda.ID_MONEDA == c.ID_MONEDA).first()
        tipo = db.query(TipoCuenta).filter(TipoCuenta.ID_TIPO_CUENTA == c.ID_TIPO_CUENTA).first()
        resultado.append({
            "id": c.ID_CBANCA,
            "id_tipo_cuenta": c.ID_TIPO_CUENTA,
            "tipo_cuenta": tipo.DESCRIP if tipo else None,
            "id_banco": c.ID_BANCO,
            "banco": banco.DESCRIP if banco else None,
            "cuenta_banc": c.CUENTA_BANC,
            "id_moneda": c.ID_MONEDA,
            "moneda": moneda.DESCRIP if moneda else None
        })
    return resultado

# === GUARDAR CUENTAS BANCARIAS ===
@router.put("/personal/{id}/cuentas-bancarias")
async def guardar_cuentas(id: int, datos: CuentasBancariasSchema, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    try:
        persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        # Eliminar cuentas anteriores
        db.query(CuentaBanca).filter(CuentaBanca.ID_PERSONAL == id).delete()
        # Insertar las nuevas
        for c in datos.cuentas:
            nueva = CuentaBanca(
                ID_PERSONAL=id, ID_TIPO_CUENTA=c.id_tipo_cuenta,
                ID_BANCO=c.id_banco, CUENTA_BANC=c.cuenta_banc,
                ID_MONEDA=c.id_moneda
            )
            db.add(nueva)
        db.commit()
        return {"mensaje": "Cuentas bancarias actualizadas"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Carpeta donde se guardan las fotos de perfil
FOTOS_DIR = Path(__file__).resolve().parent.parent / "erp-poo" / "public" / "assets" / "perfiles"

# === SUBIR FOTO DE PERFIL ===
@router.put("/personal/{id}/foto")
async def subir_foto(
    id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token)
):
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Validar tipo de archivo
    ext = Path(archivo.filename).suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG o WEBP")

    # Limitar tamaño (5 MB)
    contenido = await archivo.read()
    if len(contenido) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")

    # Nombre seguro: Nombre_Apellido_ID.ext
    nombre_seguro = re.sub(r'[^a-zA-Z0-9]', '_', persona.NOMBRES.split()[0] + "_" + persona.APE_PATERNO)
    nombre_archivo = f"{nombre_seguro}_{id}{ext}"

    # Borrar foto anterior si existe
    if persona.FOTO:
        vieja = FOTOS_DIR / persona.FOTO
        if vieja.exists():
            vieja.unlink()

    # Guardar nueva
    FOTOS_DIR.mkdir(parents=True, exist_ok=True)
    destino = FOTOS_DIR / nombre_archivo
    destino.write_bytes(contenido)

    # Actualizar BD
    persona.FOTO = nombre_archivo
    db.commit()

    return {"mensaje": "Foto actualizada", "foto": nombre_archivo}