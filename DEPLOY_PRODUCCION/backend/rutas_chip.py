
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import (
    get_db, Chips, PlanChips, OperadorChips, DescuentoChips,
    AsignacionChip, Personal, Contrato, Acceso, Empresa
)
from auth_token import verificar_token

router = APIRouter()


# ═══════════════════════════════════════════
#  CATÁLOGOS (planes, operadores, descuentos)
# ═══════════════════════════════════════════
@router.get("/chips/catalogos")
def catalogos_chip(db: Session = Depends(get_db), _=Depends(verificar_token)):
    def _lista(model, pk, desc, extras=None):
        if not model:
            return []
        rows = db.query(model).order_by(getattr(model, desc)).all()
        result = []
        for r in rows:
            item = {"id": getattr(r, pk), "nombre": getattr(r, desc)}
            if extras:
                for e in extras:
                    item[e.lower()] = getattr(r, e, None)
            result.append(item)
        return result

    return {
        "operadores": _lista(OperadorChips, 'ID_OPERADOR', 'DESCRIP'),
        "planes": _lista(PlanChips, 'ID_PLAN', 'DESCRIP'),
        "descuentos": _lista(DescuentoChips, 'ID_DESCUENTO', 'DESCRIP', ['DESCUENTO']),
        "empresas": _lista(Empresa, 'ID_EMP', 'NOMBRE'),
    }


# ═══════════════════════════════════════════
#  LISTAR CHIPS (con asignación actual)
# ═══════════════════════════════════════════
@router.get("/chips")
def listar_chips(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Chips:
        return []

    # Filtrar por empresa del token
    id_emp = token.get("id_emp", 1)
    chips = db.query(Chips).filter(Chips.ID_EMP == id_emp).order_by(Chips.NUMERO).all()

    # ── Precargar catálogos para evitar N+1 ──
    operadores_map = {}
    if OperadorChips:
        for op in db.query(OperadorChips).all():
            operadores_map[op.ID_OPERADOR] = op.DESCRIP

    planes_map = {}
    if PlanChips:
        for pl in db.query(PlanChips).all():
            planes_map[pl.ID_PLAN] = pl.DESCRIP

    descuentos_map = {}
    if DescuentoChips:
        for dc in db.query(DescuentoChips).all():
            descuentos_map[dc.ID_DESCUENTO] = (dc.DESCRIP, dc.DESCUENTO)

    empresas_map = {}
    if Empresa:
        for emp in db.query(Empresa).all():
            empresas_map[emp.ID_EMP] = emp.NOMBRE

    # Precargar asignaciones activas con datos de personal
    asignaciones_map = {}
    if AsignacionChip:
        activas = db.query(AsignacionChip).filter(AsignacionChip.FECHA_DEVOL == None).all()
        ids_personal = [a.ID_PERSONAL for a in activas]
        personal_map = {}
        if ids_personal and Personal:
            for p in db.query(Personal).filter(Personal.ID_PERSONAL.in_(ids_personal)).all():
                personal_map[p.ID_PERSONAL] = f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}"
        for a in activas:
            asignaciones_map[a.ID_CHIPS] = {
                "id_asignacion": a.ID_CHIP_ASIG,
                "id_personal": a.ID_PERSONAL,
                "empleado": personal_map.get(a.ID_PERSONAL, 'Desconocido'),
                "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
            }

    resultado = []
    for c in chips:
        desc_info = descuentos_map.get(c.ID_DESCUENTO)
        precio = float(c.PRECIO) if c.PRECIO else 0
        desc_pct = desc_info[1] if desc_info else 0
        precio_con_descuento = round(precio * (1 - (desc_pct or 0) / 100), 2)
        resultado.append({
            "id": c.ID_CHIPS,
            "id_emp": c.ID_EMP,
            "empresa": empresas_map.get(c.ID_EMP),
            "numero": c.NUMERO,
            "precio": precio,
            "id_operador": c.ID_OPERADOR,
            "operador": operadores_map.get(c.ID_OPERADOR),
            "id_plan": c.ID_PLAN,
            "plan": planes_map.get(c.ID_PLAN),
            "id_descuento": c.ID_DESCUENTO,
            "descuento": desc_info[0] if desc_info else None,
            "descuento_pct": desc_pct,
            "precio_con_descuento": precio_con_descuento,
            "fech_asignacion": str(c.FECH_ASIGNACION) if c.FECH_ASIGNACION else None,
            "asignacion": asignaciones_map.get(c.ID_CHIPS),
        })
    return resultado


# ═══════════════════════════════════════════
#  PERSONAL DISPONIBLE (para asignar chips)
# ═══════════════════════════════════════════
@router.get("/chips/personal")
def personal_disponible(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Personal or not Contrato:
        return []
    id_emp = token.get("id_emp", 1)
    contratos = db.query(Contrato).filter(
        Contrato.ID_EMP == id_emp,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).all()
    ids = [ct.ID_PERSONAL for ct in contratos]
    if not ids:
        return []
    personal = db.query(Personal).filter(Personal.ID_PERSONAL.in_(ids)).order_by(Personal.APE_PATERNO).all()
    return [
        {
            "id": p.ID_PERSONAL,
            "nombre": p.NOMBRES + ' ' + p.APE_PATERNO + ' ' + p.APE_MATERNO,
            "num_doc": p.NUM_DOC,
        }
        for p in personal
    ]


# ═══════════════════════════════════════════
#  CREAR CHIP (nueva línea)
# ═══════════════════════════════════════════
@router.post("/chips")
def crear_chip(datos: dict, db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Chips:
        raise HTTPException(status_code=500, detail="Tabla chips no disponible")

    numero = datos.get("numero", "").strip()
    if not numero:
        raise HTTPException(status_code=400, detail="Número requerido")

    # Verificar duplicado
    existente = db.query(Chips).filter(Chips.NUMERO == numero).first()
    if existente:
        raise HTTPException(status_code=400, detail="El número ya existe")

    nuevo = Chips()
    nuevo.NUMERO = numero
    nuevo.PRECIO = datos.get("precio", 0)
    nuevo.ID_OPERADOR = datos.get("id_operador") or None
    nuevo.ID_PLAN = datos.get("id_plan") or None
    nuevo.ID_DESCUENTO = datos.get("id_descuento") or None
    nuevo.FECH_ASIGNACION = datos.get("fech_asignacion") or None
    nuevo.ID_EMP = datos.get("id_emp") or token.get("id_emp", 1)

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"ok": True, "id": nuevo.ID_CHIPS, "mensaje": "Línea creada correctamente"}


# ═══════════════════════════════════════════
#  EDITAR CHIP
# ═══════════════════════════════════════════
@router.put("/chips/{id_chip}")
def editar_chip(id_chip: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Chips:
        raise HTTPException(status_code=500, detail="Tabla chips no disponible")

    chip = db.query(Chips).filter(Chips.ID_CHIPS == id_chip).first()
    if not chip:
        raise HTTPException(status_code=404, detail="Chip no encontrado")

    # Verificar duplicado de número
    if datos.get("numero"):
        dup = db.query(Chips).filter(Chips.NUMERO == datos["numero"], Chips.ID_CHIPS != id_chip).first()
        if dup:
            raise HTTPException(status_code=400, detail="El número ya está en uso")
        chip.NUMERO = datos["numero"]

    if "precio" in datos:
        chip.PRECIO = datos["precio"]
    if "id_operador" in datos:
        chip.ID_OPERADOR = datos["id_operador"] or None
    if "id_plan" in datos:
        chip.ID_PLAN = datos["id_plan"] or None
    if "id_descuento" in datos:
        chip.ID_DESCUENTO = datos["id_descuento"] or None
    if "id_emp" in datos:
        chip.ID_EMP = datos["id_emp"] or None
    if "fech_asignacion" in datos:
        chip.FECH_ASIGNACION = datos["fech_asignacion"] or None

    db.commit()
    return {"ok": True, "mensaje": "Línea actualizada correctamente"}


# ═══════════════════════════════════════════
#  ASIGNAR CHIP A PERSONAL
# ═══════════════════════════════════════════
@router.post("/chips/{id_chip}/asignar")
def asignar_chip(id_chip: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not AsignacionChip:
        raise HTTPException(status_code=500, detail="Tabla asignacion_chip no disponible")

    id_personal = datos.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Debe indicar el personal")

    # Verificar que no tenga asignación activa
    activa = db.query(AsignacionChip).filter(
        AsignacionChip.ID_CHIPS == id_chip,
        AsignacionChip.FECHA_DEVOL == None
    ).first()
    if activa:
        raise HTTPException(status_code=400, detail="El chip ya tiene asignación activa. Devuélvalo primero.")

    nueva = AsignacionChip()
    nueva.ID_CHIPS = id_chip
    nueva.ID_PERSONAL = id_personal
    nueva.FECH_ASIG = datetime.now()
    nueva.FECHA_DEVOL = None

    db.add(nueva)
    db.commit()
    return {"ok": True, "mensaje": "Chip asignado correctamente"}


# ═══════════════════════════════════════════
#  DEVOLVER / DESASIGNAR CHIP
# ═══════════════════════════════════════════
@router.put("/chips/{id_chip}/devolver")
def devolver_chip(id_chip: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not AsignacionChip:
        raise HTTPException(status_code=500, detail="Tabla asignacion_chip no disponible")

    activa = db.query(AsignacionChip).filter(
        AsignacionChip.ID_CHIPS == id_chip,
        AsignacionChip.FECHA_DEVOL == None
    ).first()
    if not activa:
        raise HTTPException(status_code=404, detail="No hay asignación activa para este chip")

    activa.FECHA_DEVOL = datetime.now()
    db.commit()
    return {"ok": True, "mensaje": "Chip devuelto correctamente"}


# ═══════════════════════════════════════════
#  REASIGNAR (devolver + asignar en un paso)
# ═══════════════════════════════════════════
@router.put("/chips/{id_chip}/reasignar")
def reasignar_chip(id_chip: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not AsignacionChip:
        raise HTTPException(status_code=500, detail="Tabla asignacion_chip no disponible")

    id_personal = datos.get("id_personal")
    if not id_personal:
        raise HTTPException(status_code=400, detail="Debe indicar el nuevo personal")

    # Devolver activa si hay
    activa = db.query(AsignacionChip).filter(
        AsignacionChip.ID_CHIPS == id_chip,
        AsignacionChip.FECHA_DEVOL == None
    ).first()
    if activa:
        activa.FECHA_DEVOL = datetime.now()

    # Nueva asignación
    nueva = AsignacionChip()
    nueva.ID_CHIPS = id_chip
    nueva.ID_PERSONAL = id_personal
    nueva.FECH_ASIG = datetime.now()
    nueva.FECHA_DEVOL = None
    db.add(nueva)

    db.commit()
    return {"ok": True, "mensaje": "Chip reasignado correctamente"}


# ═══════════════════════════════════════════
#  HISTORIAL DE ASIGNACIONES DE UN CHIP
# ═══════════════════════════════════════════
@router.get("/chips/{id_chip}/historial")
def historial_chip(id_chip: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not AsignacionChip:
        return []
    asignaciones = db.query(AsignacionChip).filter(
        AsignacionChip.ID_CHIPS == id_chip
    ).order_by(AsignacionChip.FECH_ASIG.desc()).all()

    # Precargar personal para evitar N+1
    ids_personal = list({a.ID_PERSONAL for a in asignaciones})
    personal_map = {}
    if ids_personal and Personal:
        for p in db.query(Personal).filter(Personal.ID_PERSONAL.in_(ids_personal)).all():
            personal_map[p.ID_PERSONAL] = f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}"

    resultado = []
    for a in asignaciones:
        resultado.append({
            "id": a.ID_CHIP_ASIG,
            "empleado": personal_map.get(a.ID_PERSONAL, 'Desconocido'),
            "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
            "fecha_devol": str(a.FECHA_DEVOL) if a.FECHA_DEVOL else None,
            "activa": a.FECHA_DEVOL is None,
        })
    return resultado


# ═══════════════════════════════════════════
#  AGREGAR ITEM DE CATÁLOGO (operador, plan, descuento)
# ═══════════════════════════════════════════
@router.post("/chips/catalogo/{tabla}")
def agregar_catalogo_chip(tabla: str, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    modelos = {
        "operador": OperadorChips,
        "plan": PlanChips,
        "descuento": DescuentoChips,
    }
    model = modelos.get(tabla)
    if not model:
        raise HTTPException(status_code=400, detail=f"Tabla '{tabla}' no válida")

    descrip = datos.get("descripcion", "").strip().upper()
    if not descrip:
        raise HTTPException(status_code=400, detail="Descripción requerida")

    nuevo = model()
    nuevo.DESCRIP = descrip

    if tabla == "descuento" and "descuento" in datos:
        nuevo.DESCUENTO = datos["descuento"]

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    pk_name = list(vars(nuevo).keys())
    pk_val = None
    for k in pk_name:
        if k.startswith('ID_'):
            pk_val = getattr(nuevo, k)
            break

    return {"ok": True, "id": pk_val, "nombre": descrip, "mensaje": f"{tabla.capitalize()} creado"}


# ═══════════════════════════════════════════
#  ELIMINAR CHIP
# ═══════════════════════════════════════════
@router.delete("/chips/{id_chip}")
def eliminar_chip(id_chip: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Chips:
        raise HTTPException(status_code=500, detail="Tabla chips no disponible")

    chip = db.query(Chips).filter(Chips.ID_CHIPS == id_chip).first()
    if not chip:
        raise HTTPException(status_code=404, detail="Chip no encontrado")

    # Verificar que no tenga asignación activa
    if AsignacionChip:
        activa = db.query(AsignacionChip).filter(
            AsignacionChip.ID_CHIPS == id_chip,
            AsignacionChip.FECHA_DEVOL == None
        ).first()
        if activa:
            raise HTTPException(status_code=400, detail="No se puede eliminar un chip con asignación activa")

    db.delete(chip)
    db.commit()
    return {"ok": True, "mensaje": "Línea eliminada correctamente"}
