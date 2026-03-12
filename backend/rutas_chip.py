
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import (
    get_db, Chips, PlanChips, OperadorChips, DescuentoChips,
    AsignacionChip, Personal, Contrato, Acceso
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
    }


# ═══════════════════════════════════════════
#  LISTAR CHIPS (con asignación actual)
# ═══════════════════════════════════════════
@router.get("/chips")
def listar_chips(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    if not Chips:
        return []
    chips = db.query(Chips).order_by(Chips.NUMERO).all()
    resultado = []
    for c in chips:
        # Operador
        operador = None
        if c.ID_OPERADOR and OperadorChips:
            op = db.query(OperadorChips).filter(OperadorChips.ID_OPERADOR == c.ID_OPERADOR).first()
            operador = op.DESCRIP if op else None

        # Plan
        plan = None
        if c.ID_PLAN and PlanChips:
            pl = db.query(PlanChips).filter(PlanChips.ID_PLAN == c.ID_PLAN).first()
            plan = pl.DESCRIP if pl else None

        # Descuento
        descuento = None
        descuento_pct = None
        if c.ID_DESCUENTO and DescuentoChips:
            dc = db.query(DescuentoChips).filter(DescuentoChips.ID_DESCUENTO == c.ID_DESCUENTO).first()
            if dc:
                descuento = dc.DESCRIP
                descuento_pct = dc.DESCUENTO

        # Asignación activa (FECHA_DEVOL IS NULL)
        asignacion = None
        if AsignacionChip:
            asig = db.query(AsignacionChip).filter(
                AsignacionChip.ID_CHIPS == c.ID_CHIPS,
                AsignacionChip.FECHA_DEVOL == None
            ).first()
            if asig and Personal:
                per = db.query(Personal).filter(Personal.ID_PERSONAL == asig.ID_PERSONAL).first()
                asignacion = {
                    "id_asignacion": asig.ID_CHIP_ASIG,
                    "id_personal": asig.ID_PERSONAL,
                    "empleado": (per.NOMBRES + ' ' + per.APE_PATERNO + ' ' + per.APE_MATERNO) if per else 'Desconocido',
                    "fecha_asig": str(asig.FECH_ASIG) if asig.FECH_ASIG else None,
                }

        resultado.append({
            "id": c.ID_CHIPS,
            "numero": c.NUMERO,
            "precio": float(c.PRECIO) if c.PRECIO else 0,
            "id_operador": c.ID_OPERADOR,
            "operador": operador,
            "id_plan": c.ID_PLAN,
            "plan": plan,
            "id_descuento": c.ID_DESCUENTO,
            "descuento": descuento,
            "descuento_pct": descuento_pct,
            "fech_asignacion": str(c.FECH_ASIGNACION) if c.FECH_ASIGNACION else None,
            "asignacion": asignacion,
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
        Contrato.ID_EST_CONTR == 1
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
def crear_chip(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
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
    resultado = []
    for a in asignaciones:
        per = db.query(Personal).filter(Personal.ID_PERSONAL == a.ID_PERSONAL).first() if Personal else None
        resultado.append({
            "id": a.ID_CHIP_ASIG,
            "empleado": (per.NOMBRES + ' ' + per.APE_PATERNO + ' ' + per.APE_MATERNO) if per else 'Desconocido',
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
