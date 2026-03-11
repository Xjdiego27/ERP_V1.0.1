# rutas_equipo.py
# CRUD para el módulo de Equipos IT
import os, uuid, shutil
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import (
    get_db, Equipo, TipoEquipo, EstadoEquipo, Gama, Marca, Modelo,
    Procesador, TipoRam, Ram, TipoDisco, CapacidadDisco, Disco,
    EspecificacionesTec, Almacenamiento, Personal, Contrato, Acceso,
    AsignacionEquipo
)
from auth_token import verificar_token

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "equipos")
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
        discos = db.query(Disco).all()
        result = []
        for d in discos:
            td = db.query(TipoDisco).filter(TipoDisco.ID_TDISCO == d.ID_TDISCO).first()
            cd = db.query(CapacidadDisco).filter(CapacidadDisco.ID_CAPDISCO == d.ID_CAPDISCO).first()
            result.append({
                "id": d.ID_DISCO,
                "nombre": f"{td.DESCRIP if td else '?'} - {cd.DESCRIP if cd else '?'}",
                "tipo": td.DESCRIP if td else '',
                "capacidad": cd.DESCRIP if cd else '',
                "id_tdisco": d.ID_TDISCO,
                "id_capdisco": d.ID_CAPDISCO,
            })
        return result

    return {
        "tipos_equipo": _lista(TipoEquipo, 'ID_TEQUIPO', 'DESCRIP'),
        "estados_equipo": _lista(EstadoEquipo, 'ID_EST_EQUIPO', 'DESCRIP'),
        "gamas": _lista(Gama, 'ID_GAMA', 'DESCRIP'),
        "marcas": _lista(Marca, 'ID_MARCA', 'DESCRIP'),
        "modelos": _lista(Modelo, 'ID_MODELO', 'DESCRIP'),
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

    # Campos extras para procesador
    if tabla == "procesador":
        nuevo.NUCLEOS = datos.get("nucleos", 0)
        nuevo.HILOS = datos.get("hilos", 0)

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

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
    db.commit()

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
    resultado = []

    for eq in equipos:
        tipo = db.query(TipoEquipo).filter(TipoEquipo.ID_TEQUIPO == eq.ID_TEQUIPO).first() if TipoEquipo else None
        estado = db.query(EstadoEquipo).filter(EstadoEquipo.ID_EST_EQUIPO == eq.ID_EST_EQUIPO).first() if EstadoEquipo else None
        espec = db.query(EspecificacionesTec).filter(EspecificacionesTec.ID_ESPEC == eq.ID_ESPEC).first() if EspecificacionesTec and eq.ID_ESPEC else None

        info = {
            "id_equipo": eq.ID_EQUIPO,
            "serie": eq.SERIE_EQUIPO,
            "tipo": tipo.DESCRIP if tipo else '',
            "id_tequipo": eq.ID_TEQUIPO,
            "estado": estado.DESCRIP if estado else '',
            "id_est_equipo": eq.ID_EST_EQUIPO,
        }

        if espec:
            marca = db.query(Marca).filter(Marca.ID_MARCA == espec.ID_MARCA).first() if Marca else None
            modelo = db.query(Modelo).filter(Modelo.ID_MODELO == espec.ID_MODELO).first() if Modelo else None
            proc = db.query(Procesador).filter(Procesador.ID_PROCESADOR == espec.ID_PROCESADOR).first() if Procesador else None
            gama = db.query(Gama).filter(Gama.ID_GAMA == espec.ID_GAMA).first() if Gama else None
            tram = db.query(TipoRam).filter(TipoRam.ID_TIPO_RAM == espec.ID_TIPO_RAM).first() if TipoRam else None
            ram = db.query(Ram).filter(Ram.ID_RAM == espec.ID_RAM).first() if Ram else None
            info.update({
                "codigoe": espec.CODIGOE,
                "fech_compra": str(espec.FECH_COMPRA) if espec.FECH_COMPRA else None,
                "garantia": espec.GARANTIA,
                "gama": gama.DESCRIP if gama else '',
                "marca": marca.DESCRIP if marca else '',
                "modelo": modelo.DESCRIP if modelo else '',
                "procesador": proc.DESCRIP if proc else '',
                "tipo_ram": tram.DESCRIP if tram else '',
                "ram": ram.DESCRIP if ram else '',
            })

        # Almacenamiento
        almacenes = []
        if Almacenamiento:
            for almc in db.query(Almacenamiento).filter(Almacenamiento.ID_EQUIPO == eq.ID_EQUIPO).all():
                disco = db.query(Disco).filter(Disco.ID_DISCO == almc.ID_DISCO).first() if Disco else None
                td = db.query(TipoDisco).filter(TipoDisco.ID_TDISCO == disco.ID_TDISCO).first() if disco and TipoDisco else None
                cd = db.query(CapacidadDisco).filter(CapacidadDisco.ID_CAPDISCO == disco.ID_CAPDISCO).first() if disco and CapacidadDisco else None
                almacenes.append({
                    "id_almc": almc.ID_ALMC,
                    "descrip": almc.DESCRIP or '',
                    "tipo_disco": td.DESCRIP if td else '',
                    "capacidad": cd.DESCRIP if cd else '',
                    "id_disco": almc.ID_DISCO,
                })
        info["almacenamiento"] = almacenes

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
#  SUBIR FOTO DE EQUIPO
# ═══════════════════════════════════════════
@router.post("/equipos/{id_equipo}/foto")
async def subir_foto_equipo(id_equipo: int, foto: UploadFile = File(...), _=Depends(verificar_token)):
    ext = os.path.splitext(foto.filename)[1] or ".jpg"
    nombre = f"equipo_{id_equipo}_{uuid.uuid4().hex[:8]}{ext}"
    ruta = os.path.join(UPLOAD_DIR, nombre)

    with open(ruta, "wb") as f:
        shutil.copyfileobj(foto.file, f)

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
    """Lista todas las asignaciones activas (sin fecha devol) y también el historial."""
    if not AsignacionEquipo:
        return []

    rows = db.query(AsignacionEquipo).order_by(AsignacionEquipo.FECH_ASIG.desc()).all()
    resultado = []
    for a in rows:
        eq = db.query(Equipo).filter(Equipo.ID_EQUIPO == a.ID_EQUIPO).first() if Equipo else None
        pers = db.query(Personal).filter(Personal.ID_PERSONAL == a.ID_PERSONAL).first() if Personal else None
        tipo = None
        if eq and TipoEquipo:
            tipo = db.query(TipoEquipo).filter(TipoEquipo.ID_TEQUIPO == eq.ID_TEQUIPO).first()

        resultado.append({
            "id_asig": a.ID_ASIG,
            "id_equipo": a.ID_EQUIPO,
            "serie": eq.SERIE_EQUIPO if eq else '',
            "tipo_equipo": tipo.DESCRIP if tipo else '',
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
