# helpers.py
# Funciones utilitarias compartidas entre módulos.
# Responsabilidad: lógica reutilizable (horarios, respuestas de usuario, etc.)

from database import (
    Personal, Acceso, RolAccs, Empresa, Contrato, Cargo,
    Horario, HorarioDetalle,
)
from servicios.permiso_service import PermisoService

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
        "genero": "M" if (personal and personal.GENERO_PERS == 1) else ("F" if personal else None),
    }
