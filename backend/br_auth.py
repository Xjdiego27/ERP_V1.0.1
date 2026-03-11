from sqlalchemy.orm import Session
from database import Acceso, Personal, RolAccs, Contrato, Cargo, Empresa, AsignacionEmp
from sqlalchemy import and_
from rutas_password import verificar_password, _es_texto_plano


def validar_usuario_br(db: Session, usuario_input: str, password_input: str):
    """
    Valida credenciales (usuario + password) SIN empresa.
    Retorna datos del usuario + lista de empresas asignadas.
    """
    usuario_db = db.query(Acceso).filter(Acceso.USUARIO == usuario_input).first()

    if not usuario_db:
        return {"status": "error", "mensaje": "USUARIO NO ENCONTRADO"}

    if usuario_db.ID_ESTADO == 2:
        return {"status": "error", "mensaje": "CUENTA BLOQUEADA", "id_estado": 2}

    if verificar_password(password_input, usuario_db.PASSWORD):
        usuario_db.INTENT_LOGIN = 0
        db.commit()

        # Detectar si debe forzar cambio de contraseña
        requiere_cambio = _es_texto_plano(usuario_db.PASSWORD)

        personal = db.query(Personal).filter(Personal.ID_ACCS == usuario_db.ID_ACCS).first()
        rol = db.query(RolAccs).filter(RolAccs.ID_ROL == usuario_db.ID_ROL).first()

        # Obtener empresas asignadas al usuario via asignacion_emp
        empresas_usuario = []
        if AsignacionEmp:
            asignaciones = db.query(AsignacionEmp).filter(
                AsignacionEmp.ID_ACCS == usuario_db.ID_ACCS
            ).all()
            for asig in asignaciones:
                emp = db.query(Empresa).filter(Empresa.ID_EMP == asig.ID_EMP).first()
                if emp:
                    empresas_usuario.append({
                        "id_emp": emp.ID_EMP,
                        "nombre": emp.NOMBRE,
                        "logo": emp.LOGO,
                        "logo_dark": getattr(emp, 'LOGO_DARK', None),
                    })


        return {
            "status":   "ok",
            "mensaje":  "EXITO",
            "usuario":  usuario_db.USUARIO,
            "nombre":   personal.NOMBRES     if personal else usuario_db.USUARIO,
            "apellido": f"{personal.APE_PATERNO} {personal.APE_MATERNO}" if personal else "",
            "foto":     personal.FOTO        if personal else None,
            "id_personal": personal.ID_PERSONAL if personal else None,
            "id_rol":   usuario_db.ID_ROL,
            "id_accs":  usuario_db.ID_ACCS,
            "rol":      rol.DESCRIP if rol else None,
            "empresas": empresas_usuario,
            "requiere_cambio_password": requiere_cambio,
        }

    else:
        intentos = (usuario_db.INTENT_LOGIN or 0) + 1

        if intentos >= 3:
            usuario_db.ID_ESTADO = 2
            usuario_db.INTENT_LOGIN = 0
            db.commit()
            return {
                "status": "error",
                "mensaje": "DEMASIADOS INTENTOS: CUENTA BLOQUEADA",
                "id_estado": 2
            }

        usuario_db.INTENT_LOGIN = intentos
        db.commit()
        return {
            "status": "error",
            "mensaje": f"CLAVE INCORRECTA: {intentos}/3",
            "intentos": intentos
        }


def obtener_datos_empresa(db: Session, id_accs: int, id_empresa: int):
    """
    Dado un usuario (id_accs) y la empresa seleccionada,
    obtiene el cargo del contrato vigente (ID_ESTADO_CONTRATO=1) en esa empresa.
    """
    personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    if not personal:
        return None

    contrato_obj = (
        db.query(Contrato)
        .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(
            Contrato.ID_PERSONAL == personal.ID_PERSONAL,
            Cargo.ID_EMP == id_empresa,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .first()
    )

    cargo_nombre = None
    if contrato_obj:
        cargo_obj = db.query(Cargo).filter(Cargo.ID_CARGO == contrato_obj.ID_CARGO).first()
        if cargo_obj:
            cargo_nombre = cargo_obj.DESCRIP

    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    rol = db.query(RolAccs).filter(RolAccs.ID_ROL == acceso.ID_ROL).first() if acceso else None

    return {
        "id_personal": personal.ID_PERSONAL,
        "cargo": cargo_nombre,
        "rol": rol.DESCRIP if rol else None,
        "id_rol": acceso.ID_ROL if acceso else None,
    }