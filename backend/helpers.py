# helpers.py
# Funciones utilitarias compartidas entre módulos.
# Responsabilidad: lógica reutilizable (horarios, respuestas de usuario, etc.)

from fastapi import HTTPException
from database import (
    Personal, Acceso, RolAccs, Empresa, Contrato, Cargo,
    Horario, HorarioDetalle,
)
from servicios.permiso_service import PermisoService


# ──────────────────────────────────────────
# Consulta de empleados activos (reutilizable)
# Evita duplicar el join Personal→Acceso→Contrato en 8+ archivos
# ──────────────────────────────────────────
def empleados_activos_query(db):
    """Retorna query base de Personal con Acceso activo + Contrato vigente.
    Uso: db empleados = empleados_activos_query(db).all()
    Se puede encadenar .filter() adicional antes de .all()."""
    return (
        db.query(Personal)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
    )


def empleados_activos_unicos(db):
    """Retorna lista de Personal activos sin duplicados (por ID_PERSONAL)."""
    rows = empleados_activos_query(db).all()
    vistos = set()
    unicos = []
    for p in rows:
        if p.ID_PERSONAL not in vistos:
            vistos.add(p.ID_PERSONAL)
            unicos.append(p)
    return unicos


# ──────────────────────────────────────────
# Validación de archivos subidos
# ──────────────────────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES | {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
}


async def validar_archivo(archivo, solo_imagenes=False, max_size=MAX_FILE_SIZE):
    """Valida tipo y tamaño de un archivo subido. Lanza HTTPException si es inválido."""
    tipos_permitidos = ALLOWED_IMAGE_TYPES if solo_imagenes else ALLOWED_FILE_TYPES
    content_type = archivo.content_type or ''
    if content_type not in tipos_permitidos:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: {content_type}"
        )
    contenido = await archivo.read()
    if len(contenido) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo demasiado grande (máx {max_size // 1024 // 1024} MB)"
        )
    await archivo.seek(0)  # Rebobinar para lectura posterior
    return contenido

# ──────────────────────────────────────────
# Rango legible de un horario
# ──────────────────────────────────────────
_DIA_ABREV = {1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom"}


def rango_horario(detalles):
    """Genera string compacto del horario.
    detalles = lista de (dia, hora_e, hora_s, descanso)  (dia 1-7)
    Retorna algo como 'Lun-Sáb 08:00-17:30' o 'Lun-Vie 08:00-17:30 · Sáb 08:00-12:00'
    """
    if not detalles:
        return ""
    grupos = {}
    for dia, hora_e, hora_s, descanso in sorted(detalles, key=lambda x: x[0]):
        if descanso:
            continue
        he = str(hora_e)[:5] if hora_e else "?"
        hs = str(hora_s)[:5] if hora_s else "?"
        key = (he, hs)
        grupos.setdefault(key, []).append(dia)
    if not grupos:
        return "Descanso"
    partes = []
    for (he, hs), dias in grupos.items():
        if len(dias) == 1:
            label = _DIA_ABREV.get(dias[0], "?")
        elif dias == list(range(dias[0], dias[-1] + 1)):
            label = f"{_DIA_ABREV.get(dias[0], '?')}-{_DIA_ABREV.get(dias[-1], '?')}"
        else:
            label = ", ".join(_DIA_ABREV.get(d, "?") for d in dias)
        partes.append(f"{label} {he}-{hs}")
    return " · ".join(partes)


def construir_rangos_horarios(db):
    """Pre-carga todos los horarios y retorna dict {id_horario: rango_str}."""
    rangos = {}
    if HorarioDetalle:
        from collections import defaultdict
        detalle_map = defaultdict(list)
        for dh in db.query(HorarioDetalle).all():
            detalle_map[dh.ID_HORARIO].append(
                (dh.DIA, dh.HORA_E, dh.HORA_S, bool(getattr(dh, 'DIA_DESC', 0)))
            )
        for id_h, dets in detalle_map.items():
            rangos[id_h] = rango_horario(dets)
    return rangos


# ──────────────────────────────────────────
# Construir respuesta de usuario (login / verificar)
# Evita duplicación en main.py
# ──────────────────────────────────────────
def construir_respuesta_usuario(db, acceso, id_empresa):
    """Construye el dict 'usuario' usado en login, seleccionar-empresa y verificar."""
    personal = db.query(Personal).filter(Personal.ID_ACCS == acceso.ID_ACCS).first()
    empresa = db.query(Empresa).filter(Empresa.ID_EMP == id_empresa).first()
    rol = db.query(RolAccs).filter(RolAccs.ID_ROL == acceso.ID_ROL).first()

    # Cargo del contrato vigente en la empresa seleccionada
    # Nota: contrato no tiene ID_EMP; la empresa va por cargo.ID_EMP
    cargo_nombre = None
    if personal:
        contrato = (
            db.query(Contrato)
            .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
            .filter(
                Contrato.ID_PERSONAL == personal.ID_PERSONAL,
                Cargo.ID_EMP == id_empresa,
                Contrato.ID_ESTADO_CONTRATO == 1,
            )
            .first()
        )
        if contrato:
            cargo_obj = db.query(Cargo).filter(Cargo.ID_CARGO == contrato.ID_CARGO).first()
            if cargo_obj:
                cargo_nombre = cargo_obj.DESCRIP

    # Módulos permitidos para este usuario (por rol).
    # Lógica SEPARADA del acceso a empresas (AsignacionEmp).
    # Siempre retorna list (vacía si no hay asignaciones). NUNCA None.
    modulos = PermisoService(db).obtener_modulos_rol(acceso.ID_ROL)

    return {
        "nombre": personal.NOMBRES if personal else acceso.USUARIO,
        "apellido": f"{personal.APE_PATERNO} {personal.APE_MATERNO}" if personal else "",
        "foto": personal.FOTO if personal else None,
        "id_personal": personal.ID_PERSONAL if personal else None,
        "id_accs": acceso.ID_ACCS,
        "id_empresa": id_empresa,
        "id_rol": acceso.ID_ROL,
        "logo_empresa": empresa.LOGO if empresa else None,
        "logo_dark_empresa": getattr(empresa, 'LOGO_DARK', None) if empresa else None,
        "rol": rol.DESCRIP if rol else None,
        "cargo": cargo_nombre,
        "usuario": acceso.USUARIO,
        "modulos": modulos,
        "genero": ({1: "M", 2: "F"}.get(personal.GENERO_PERS)) if personal else None,
    }
