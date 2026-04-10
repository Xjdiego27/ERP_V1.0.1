# rutas_equipo.py
# CRUD para el módulo de Equipos IT
import os, uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import (
    get_db, settings, Equipo, TipoEquipo, EstadoEquipo, Gama, Marca, Modelo,
    Procesador, TipoRam, Ram, TipoDisco, CapacidadDisco, Disco,
    EspecificacionesTec, Almacenamiento, Personal, Contrato, Acceso,
    AsignacionEquipo, Licencia, AsignacionLicencia
)
from auth_token import verificar_token

router = APIRouter()

_static_root = settings.static_dir or os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public")
UPLOAD_DIR = os.path.join(_static_root, "assets", "equipos")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ═══════════════════════════════════════════
#  CATALOGOS (para los selectores del form)
# ═══════════════════════════════════════════
@router.get("/equipos/catalogos")
def catalogos_equipo(db: Session = Depends(get_db), _=Depends(verificar_token)):
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

    def _lista_disco(db):
        if not Disco or not TipoDisco or not CapacidadDisco:
            return []
        # Precargar catálogos
        td_map = {t.ID_TDISCO: t.DESCRIP for t in db.query(TipoDisco).all()}
        cd_map = {c.ID_CAPDISCO: c.DESCRIP for c in db.query(CapacidadDisco).all()}
        discos = db.query(Disco).all()
        result = []
        for d in discos:
            td_nombre = td_map.get(d.ID_TDISCO, '?')
            cd_nombre = cd_map.get(d.ID_CAPDISCO, '?')
            result.append({
                "id": d.ID_DISCO,
                "nombre": f"{td_nombre} - {cd_nombre}",
                "tipo": td_nombre,
                "capacidad": cd_nombre,
                "id_tdisco": d.ID_TDISCO,
                "id_capdisco": d.ID_CAPDISCO,
            })
        return result

    return {
        "tipos_equipo": _lista(TipoEquipo, 'ID_TEQUIPO', 'DESCRIP'),
        "estados_equipo": _lista(EstadoEquipo, 'ID_EST_EQUIPO', 'DESCRIP'),
        "gamas": _lista(Gama, 'ID_GAMA', 'DESCRIP'),
        "marcas": _lista(Marca, 'ID_MARCA', 'DESCRIP', ['ID_TEQUIPO']),
        "modelos": _lista(Modelo, 'ID_MODELO', 'DESCRIP', ['ID_MARCA']),
        "procesadores": _lista(Procesador, 'ID_PROCESADOR', 'DESCRIP', ['NUCLEOS', 'HILOS']),
        "tipos_ram": _lista(TipoRam, 'ID_TIPO_RAM', 'DESCRIP'),
        "rams": _lista(Ram, 'ID_RAM', 'DESCRIP'),
        "tipos_disco": _lista(TipoDisco, 'ID_TDISCO', 'DESCRIP'),
        "capacidades_disco": _lista(CapacidadDisco, 'ID_CAPDISCO', 'DESCRIP'),
        "discos": _lista_disco(db),
    }


# ═══════════════════════════════════════════
#  AGREGAR ITEM DE CATALOGO (ej: nueva marca)
# ═══════════════════════════════════════════
@router.post("/equipos/catalogo/{tabla}")
def agregar_catalogo(tabla: str, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    modelos = {
        "marca": Marca, "modelo": Modelo, "procesador": Procesador,
        "tipo_equipo": TipoEquipo, "gama": Gama,
        "tipo_ram": TipoRam, "ram": Ram,
        "tipo_disco": TipoDisco, "capacidad_disco": CapacidadDisco,
    }
    model = modelos.get(tabla)
    if not model:
        raise HTTPException(status_code=400, detail=f"Tabla '{tabla}' no válida")

    descrip = datos.get("descripcion", "").strip().upper()
    if not descrip:
        raise HTTPException(status_code=400, detail="Descripción requerida")

    nuevo = model()
    nuevo.DESCRIP = descrip

    # Campos extras según tabla
    if tabla == "procesador":
        nuevo.NUCLEOS = datos.get("nucleos", 0)
        nuevo.HILOS = datos.get("hilos", 0)
    elif tabla == "marca":
        id_tequipo = datos.get("id_tequipo")
        if not id_tequipo:
            raise HTTPException(status_code=400, detail="Se requiere el tipo de equipo para crear una marca")
        nuevo.ID_TEQUIPO = int(id_tequipo)
    elif tabla == "modelo":
        id_marca = datos.get("id_marca")
        if not id_marca:
            raise HTTPException(status_code=400, detail="Se requiere la marca para crear un modelo")
        nuevo.ID_MARCA = int(id_marca)

    try:
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear: {str(e)}")

    pk_col = list(model.__table__.primary_key.columns)[0].name
    return {"id": getattr(nuevo, pk_col), "nombre": nuevo.DESCRIP}


# ═══════════════════════════════════════════
#  EDITAR ITEM DE CATALOGO
# ═══════════════════════════════════════════
@router.put("/equipos/catalogo/{tabla}/{item_id}")
def editar_catalogo(tabla: str, item_id: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    modelos = {
        "marca": Marca, "modelo": Modelo, "procesador": Procesador,
        "tipo_equipo": TipoEquipo, "gama": Gama,
        "tipo_ram": TipoRam, "ram": Ram,
        "tipo_disco": TipoDisco, "capacidad_disco": CapacidadDisco,
    }
    model = modelos.get(tabla)
    if not model:
        raise HTTPException(status_code=400, detail=f"Tabla '{tabla}' no válida")

    pk_col = list(model.__table__.primary_key.columns)[0].name
    item = db.query(model).filter(getattr(model, pk_col) == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    descrip = datos.get("descripcion", "").strip().upper()
    if not descrip:
        raise HTTPException(status_code=400, detail="Descripción requerida")

    item.DESCRIP = descrip
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar: {str(e)}")

    return {"id": getattr(item, pk_col), "nombre": item.DESCRIP}


# ═══════════════════════════════════════════
#  CREAR DISCO (combo tipo + capacidad)
# ═══════════════════════════════════════════
@router.post("/equipos/disco")
def crear_disco(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Disco:
        raise HTTPException(status_code=500, detail="Tabla disco no disponible")

    id_tdisco = datos.get("id_tdisco")
    id_capdisco = datos.get("id_capdisco")
    if not id_tdisco or not id_capdisco:
        raise HTTPException(status_code=400, detail="Tipo y capacidad de disco requeridos")

    # Verificar si ya existe esa combinación
    existe = db.query(Disco).filter(
        Disco.ID_TDISCO == id_tdisco, Disco.ID_CAPDISCO == id_capdisco
    ).first()
    if existe:
        td = db.query(TipoDisco).filter(TipoDisco.ID_TDISCO == id_tdisco).first()
        cd = db.query(CapacidadDisco).filter(CapacidadDisco.ID_CAPDISCO == id_capdisco).first()
        return {"id": existe.ID_DISCO, "nombre": f"{td.DESCRIP} - {cd.DESCRIP}", "existente": True}

    nuevo = Disco()
    nuevo.ID_TDISCO = id_tdisco
    nuevo.ID_CAPDISCO = id_capdisco
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    td = db.query(TipoDisco).filter(TipoDisco.ID_TDISCO == id_tdisco).first()
    cd = db.query(CapacidadDisco).filter(CapacidadDisco.ID_CAPDISCO == id_capdisco).first()
    return {"id": nuevo.ID_DISCO, "nombre": f"{td.DESCRIP if td else ''} - {cd.DESCRIP if cd else ''}"}


# ═══════════════════════════════════════════
#  LISTAR EQUIPOS
# ═══════════════════════════════════════════
@router.get("/equipos")
def listar_equipos(db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Equipo:
        return []

    equipos = db.query(Equipo).all()

    # ── Precargar catálogos para evitar N+1 ──
    tipos_map = {}
    if TipoEquipo:
        for t in db.query(TipoEquipo).all():
            tipos_map[t.ID_TEQUIPO] = t.DESCRIP

    estados_map = {}
    if EstadoEquipo:
        for e in db.query(EstadoEquipo).all():
            estados_map[e.ID_EST_EQUIPO] = e.DESCRIP

    marcas_map = {}
    if Marca:
        for m in db.query(Marca).all():
            marcas_map[m.ID_MARCA] = m.DESCRIP

    modelos_map = {}
    if Modelo:
        for m in db.query(Modelo).all():
            modelos_map[m.ID_MODELO] = m.DESCRIP

    procs_map = {}
    if Procesador:
        for p in db.query(Procesador).all():
            procs_map[p.ID_PROCESADOR] = p.DESCRIP

    gamas_map = {}
    if Gama:
        for g in db.query(Gama).all():
            gamas_map[g.ID_GAMA] = g.DESCRIP

    trams_map = {}
    if TipoRam:
        for t in db.query(TipoRam).all():
            trams_map[t.ID_TIPO_RAM] = t.DESCRIP

    rams_map = {}
    if Ram:
        for r in db.query(Ram).all():
            rams_map[r.ID_RAM] = r.DESCRIP

    tdiscos_map = {}
    if TipoDisco:
        for t in db.query(TipoDisco).all():
            tdiscos_map[t.ID_TDISCO] = t.DESCRIP

    capdiscos_map = {}
    if CapacidadDisco:
        for c in db.query(CapacidadDisco).all():
            capdiscos_map[c.ID_CAPDISCO] = c.DESCRIP

    discos_map = {}
    if Disco:
        for d in db.query(Disco).all():
            discos_map[d.ID_DISCO] = (d.ID_TDISCO, d.ID_CAPDISCO)

    # Precargar especificaciones
    espec_ids = [eq.ID_ESPEC for eq in equipos if eq.ID_ESPEC]
    espec_map = {}
    if espec_ids and EspecificacionesTec:
        for e in db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC.in_(espec_ids)).all():
            espec_map[e.ID_ESPEC] = e

    # Precargar almacenamiento
    eq_ids = [eq.ID_EQUIPO for eq in equipos]
    almc_map = {}
    if Almacenamiento and eq_ids:
        for a in db.query(Almacenamiento).filter(Almacenamiento.ID_EQUIPO.in_(eq_ids)).all():
            almc_map.setdefault(a.ID_EQUIPO, []).append(a)

    # Precargar licencias asignadas a equipos
    lic_asig_map = {}
    lic_map = {}
    if AsignacionLicencia and Licencia and eq_ids:
        for al in db.query(AsignacionLicencia).filter(AsignacionLicencia.ID_EQUIPO.in_(eq_ids)).all():
            lic_asig_map.setdefault(al.ID_EQUIPO, []).append(al)
        lic_ids = set()
        for lista in lic_asig_map.values():
            for al in lista:
                lic_ids.add(al.ID_LICENCIA)
        if lic_ids:
            for l in db.query(Licencia).filter(Licencia.ID_LICENCIA.in_(list(lic_ids))).all():
                lic_map[l.ID_LICENCIA] = l

    resultado = []
    for eq in equipos:
        espec = espec_map.get(eq.ID_ESPEC)

        info = {
            "id_equipo": eq.ID_EQUIPO,
            "serie": eq.SERIE_EQUIPO,
            "tipo": tipos_map.get(eq.ID_TEQUIPO, ''),
            "id_tequipo": eq.ID_TEQUIPO,
            "estado": estados_map.get(eq.ID_EST_EQUIPO, ''),
            "id_est_equipo": eq.ID_EST_EQUIPO,
        }

        if espec:
            info.update({
                "codigoe": espec.CODIGOE,
                "fech_compra": str(espec.FECH_COMPRA) if espec.FECH_COMPRA else None,
                "garantia": espec.GARANTIA,
                "gama": gamas_map.get(espec.ID_GAMA, ''),
                "marca": marcas_map.get(espec.ID_MARCA, ''),
                "modelo": modelos_map.get(espec.ID_MODELO, ''),
                "procesador": procs_map.get(espec.ID_PROCESADOR, ''),
                "tipo_ram": trams_map.get(espec.ID_TIPO_RAM, ''),
                "ram": rams_map.get(espec.ID_RAM, ''),
            })

        # Almacenamiento
        almacenes = []
        for almc in almc_map.get(eq.ID_EQUIPO, []):
            disco_info = discos_map.get(almc.ID_DISCO)
            almacenes.append({
                "id_almc": almc.ID_ALMC,
                "descrip": almc.DESCRIP or '',
                "tipo_disco": tdiscos_map.get(disco_info[0], '') if disco_info else '',
                "capacidad": capdiscos_map.get(disco_info[1], '') if disco_info else '',
                "id_disco": almc.ID_DISCO,
            })
        info["almacenamiento"] = almacenes

        # Licencias asignadas
        licencias_eq = []
        for al in lic_asig_map.get(eq.ID_EQUIPO, []):
            l = lic_map.get(al.ID_LICENCIA)
            if l:
                licencias_eq.append({
                    "id_asiglicenc": al.ID_ASIGLICENC,
                    "id_licencia": l.ID_LICENCIA,
                    "descripcion": l.DESCRIP,
                    "serie_keys": l.SERIE_KEYS,
                })
        info["licencias"] = licencias_eq

        resultado.append(info)

    return resultado


# ═══════════════════════════════════════════
#  CREAR EQUIPO
# ═══════════════════════════════════════════
@router.post("/equipos")
def crear_equipo(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Equipo or not EspecificacionesTec:
        raise HTTPException(status_code=500, detail="Tablas de equipo no disponibles")

    # 1. Crear especificaciones técnicas
    espec = EspecificacionesTec()
    espec.CODIGOE = datos.get("codigoe", "")
    fech = datos.get("fech_compra")
    espec.FECH_COMPRA = date.fromisoformat(fech) if fech else None
    espec.GARANTIA = datos.get("garantia", 0)
    espec.ID_GAMA = datos.get("id_gama")
    espec.ID_MARCA = datos.get("id_marca")
    espec.ID_MODELO = datos.get("id_modelo")
    espec.ID_PROCESADOR = datos.get("id_procesador")
    espec.ID_TIPO_RAM = datos.get("id_tipo_ram")
    espec.ID_RAM = datos.get("id_ram")
    db.add(espec)
    db.flush()

    # 2. Crear equipo
    equipo = Equipo()
    equipo.SERIE_EQUIPO = datos.get("serie", "").strip().upper()
    equipo.ID_TEQUIPO = datos.get("id_tequipo")
    equipo.ID_EST_EQUIPO = datos.get("id_est_equipo", 1)  # DISPONIBLE por defecto
    equipo.ID_ESPEC = espec.ID_ESPEC
    db.add(equipo)
    db.flush()

    # 3. Almacenamiento (lista de discos)
    almacenamientos = datos.get("almacenamiento", [])
    for almc in almacenamientos:
        nuevo_almc = Almacenamiento()
        nuevo_almc.ID_EQUIPO = equipo.ID_EQUIPO
        nuevo_almc.ID_DISCO = almc.get("id_disco")
        nuevo_almc.DESCRIP = almc.get("descrip", "")
        db.add(nuevo_almc)

    db.commit()
    return {"status": "ok", "id_equipo": equipo.ID_EQUIPO, "mensaje": "Equipo creado correctamente"}


# ═══════════════════════════════════════════
#  EDITAR ESPECIFICACIONES DE UN EQUIPO
# ═══════════════════════════════════════════
@router.put("/equipos/{id_equipo}")
def editar_equipo(id_equipo: int, datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Edita las especificaciones técnicas de un equipo y gestiona almacenamiento."""
    if not Equipo or not EspecificacionesTec:
        raise HTTPException(status_code=500, detail="Tablas no disponibles")

    eq = db.query(Equipo).filter(Equipo.ID_EQUIPO == id_equipo).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    # Actualizar serie si viene
    serie = datos.get("serie")
    if serie is not None:
        eq.SERIE_EQUIPO = serie.strip().upper()

    # Actualizar estado
    id_est = datos.get("id_est_equipo")
    if id_est is not None:
        eq.ID_EST_EQUIPO = int(id_est)

    # Actualizar tipo equipo
    id_tequipo = datos.get("id_tequipo")
    if id_tequipo is not None:
        eq.ID_TEQUIPO = int(id_tequipo)

    # Especificaciones técnicas
    espec = None
    if eq.ID_ESPEC:
        espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC).first()

    if not espec:
        espec = EspecificacionesTec()
        db.add(espec)
        db.flush()
        eq.ID_ESPEC = espec.ID_ESPEC

    # Actualizar campos de especificaciones
    campos_espec = {
        "codigoe": "CODIGOE", "garantia": "GARANTIA",
        "id_gama": "ID_GAMA", "id_marca": "ID_MARCA", "id_modelo": "ID_MODELO",
        "id_procesador": "ID_PROCESADOR", "id_tipo_ram": "ID_TIPO_RAM", "id_ram": "ID_RAM"
    }
    for key_json, col_db in campos_espec.items():
        val = datos.get(key_json)
        if val is not None:
            setattr(espec, col_db, int(val) if key_json.startswith("id_") else val)

    fech = datos.get("fech_compra")
    if fech is not None:
        espec.FECH_COMPRA = date.fromisoformat(fech) if fech else None

    # Almacenamiento — sincronizar lista de discos
    almacenamiento_nuevo = datos.get("almacenamiento")
    if almacenamiento_nuevo is not None:
        # Borrar los existentes
        if Almacenamiento:
            db.query(Almacenamiento).filter(Almacenamiento.ID_EQUIPO == id_equipo).delete()
        # Crear los nuevos
        for almc in almacenamiento_nuevo:
            nuevo_almc = Almacenamiento()
            nuevo_almc.ID_EQUIPO = id_equipo
            nuevo_almc.ID_DISCO = almc.get("id_disco")
            nuevo_almc.DESCRIP = almc.get("descrip", "")
            db.add(nuevo_almc)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar: {str(e)}")

    return {"status": "ok", "mensaje": "Equipo actualizado correctamente"}


# ═══════════════════════════════════════════
#  SUBIR FOTO DE EQUIPO
# ═══════════════════════════════════════════
@router.post("/equipos/{id_equipo}/foto")
async def subir_foto_equipo(id_equipo: int, foto: UploadFile = File(...), _=Depends(verificar_token)):
    # Validar tipo de archivo
    ext = os.path.splitext(foto.filename)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG o WEBP")
    contenido = await foto.read()
    if len(contenido) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")

    nombre = f"equipo_{id_equipo}_{uuid.uuid4().hex[:8]}{ext}"
    ruta = os.path.join(UPLOAD_DIR, nombre)

    with open(ruta, "wb") as f:
        f.write(contenido)

    return {"url": f"assets/equipos/{nombre}"}


# ═══════════════════════════════════════════
#  ELIMINAR ALMACENAMIENTO
# ═══════════════════════════════════════════
@router.delete("/equipos/almacenamiento/{id_almc}")
def eliminar_almacenamiento(id_almc: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    if not Almacenamiento:
        raise HTTPException(status_code=500, detail="Tabla almacenamiento no disponible")
    almc = db.query(Almacenamiento).filter(Almacenamiento.ID_ALMC == id_almc).first()
    if not almc:
        raise HTTPException(status_code=404, detail="Almacenamiento no encontrado")
    db.delete(almc)
    db.commit()
    return {"status": "ok"}


# ═══════════════════════════════════════════
#  ASIGNACIONES DE EQUIPO
# ═══════════════════════════════════════════

@router.get("/equipos/asignaciones")
def listar_asignaciones(db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Lista todas las asignaciones activas y el historial."""
    if not AsignacionEquipo:
        return []

    rows = db.query(AsignacionEquipo).order_by(AsignacionEquipo.FECH_ASIG.desc()).all()

    # Precargar equipos y personal
    eq_ids = list({a.ID_EQUIPO for a in rows})
    per_ids = list({a.ID_PERSONAL for a in rows})

    equipos_map = {}
    if eq_ids and Equipo:
        for eq in db.query(Equipo).filter(Equipo.ID_EQUIPO.in_(eq_ids)).all():
            equipos_map[eq.ID_EQUIPO] = eq

    personal_map = {}
    if per_ids and Personal:
        for p in db.query(Personal).filter(Personal.ID_PERSONAL.in_(per_ids)).all():
            personal_map[p.ID_PERSONAL] = p

    tipos_map = {}
    if TipoEquipo:
        for t in db.query(TipoEquipo).all():
            tipos_map[t.ID_TEQUIPO] = t.DESCRIP

    resultado = []
    for a in rows:
        eq = equipos_map.get(a.ID_EQUIPO)
        pers = personal_map.get(a.ID_PERSONAL)

        resultado.append({
            "id_asig": a.ID_ASIG,
            "id_equipo": a.ID_EQUIPO,
            "serie": eq.SERIE_EQUIPO if eq else '',
            "tipo_equipo": tipos_map.get(eq.ID_TEQUIPO, '') if eq else '',
            "id_personal": a.ID_PERSONAL,
            "empleado": f"{pers.APE_PATERNO} {pers.APE_MATERNO}, {pers.NOMBRES}" if pers else '',
            "fecha_asig": str(a.FECH_ASIG) if a.FECH_ASIG else None,
            "fecha_devol": str(a.FECHA_DEVOL) if a.FECHA_DEVOL else None,
            "activa": a.FECHA_DEVOL is None,
        })
    return resultado


@router.get("/equipos/disponibles")
def equipos_disponibles(db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Equipos con estado DISPONIBLE (ID_EST_EQUIPO=1)."""
    if not Equipo:
        return []
    equipos = db.query(Equipo).filter(Equipo.ID_EST_EQUIPO == 1).all()
    resultado = []
    for eq in equipos:
        tipo = db.query(TipoEquipo).filter(TipoEquipo.ID_TEQUIPO == eq.ID_TEQUIPO).first() if TipoEquipo else None
        espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC).first() if EspecificacionesTec and eq.ID_ESPEC else None
        marca = ''
        if espec and Marca:
            m = db.query(Marca).filter(Marca.ID_MARCA == espec.ID_MARCA).first()
            marca = m.DESCRIP if m else ''
        resultado.append({
            "id_equipo": eq.ID_EQUIPO,
            "serie": eq.SERIE_EQUIPO,
            "tipo": tipo.DESCRIP if tipo else '',
            "marca": marca,
        })
    return resultado


@router.get("/equipos/empleados-activos")
def empleados_activos(db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Lista de empleados con contrato activo y cuenta activa."""
    if not Personal or not Contrato:
        return []
    registros = db.query(Personal).join(
        Acceso, Personal.ID_ACCS == Acceso.ID_ACCS
    ).join(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).filter(
        Acceso.ID_ESTADO == 1,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).order_by(Personal.APE_PATERNO).all()
    return [{"id_personal": p.ID_PERSONAL, "nombre": f"{p.APE_PATERNO} {p.APE_MATERNO}, {p.NOMBRES}"} for p in registros]


@router.post("/equipos/asignar")
def asignar_equipo(datos: dict, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Asigna un equipo a un empleado."""
    if not AsignacionEquipo or not Equipo:
        raise HTTPException(status_code=500, detail="Tablas no disponibles")

    id_equipo = datos.get("id_equipo")
    id_personal = datos.get("id_personal")

    if not id_equipo or not id_personal:
        raise HTTPException(status_code=400, detail="Equipo y empleado son obligatorios")

    eq = db.query(Equipo).filter(Equipo.ID_EQUIPO == id_equipo).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    if eq.ID_EST_EQUIPO != 1:
        raise HTTPException(status_code=400, detail="El equipo no está disponible")

    asig = AsignacionEquipo()
    asig.ID_EQUIPO = id_equipo
    asig.ID_PERSONAL = id_personal
    asig.FECH_ASIG = date.today()
    db.add(asig)

    # Cambiar estado a ASIGNADO
    eq.ID_EST_EQUIPO = 2
    db.commit()
    return {"status": "ok", "mensaje": "Equipo asignado correctamente"}


@router.put("/equipos/devolver/{id_asig}")
def devolver_equipo(id_asig: int, db: Session = Depends(get_db), _=Depends(verificar_token)):
    """Devuelve un equipo (registra fecha devolución, vuelve a DISPONIBLE)."""
    if not AsignacionEquipo or not Equipo:
        raise HTTPException(status_code=500, detail="Tablas no disponibles")

    asig = db.query(AsignacionEquipo).filter(AsignacionEquipo.ID_ASIG == id_asig).first()
    if not asig:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if asig.FECHA_DEVOL:
        raise HTTPException(status_code=400, detail="Ya fue devuelto")

    asig.FECHA_DEVOL = date.today()

    eq = db.query(Equipo).filter(Equipo.ID_EQUIPO == asig.ID_EQUIPO).first()
    if eq:
        eq.ID_EST_EQUIPO = 1  # DISPONIBLE
    db.commit()
    return {"status": "ok", "mensaje": "Equipo devuelto correctamente"}
