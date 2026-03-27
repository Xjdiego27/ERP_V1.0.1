from sqlalchemy.orm import Session
from database import Acceso, Personal, RolAccs, Empresa, AsignacionEmp
from rutas_password import verificar_password, _es_texto_plano, hashear_password


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

        # Auto-rehash: migrar contraseña plana a Argon2 de forma transparente
        if _es_texto_plano(usuario_db.PASSWORD):
            usuario_db.PASSWORD = hashear_password(password_input)

        db.commit()

        # Detectar si debe forzar cambio de contraseña (RESET_PASS=1 en BD)
        requiere_cambio = bool(getattr(usuario_db, 'RESET_PASS', 0))

        personal = db.query(Personal).filter(Personal.ID_ACCS == usuario_db.ID_ACCS).first()
        rol = db.query(RolAccs).filter(RolAccs.ID_ROL == usuario_db.ID_ROL).first()

        # Obtener empresas asignadas al usuario via asignacion_emp
        empresas_usuario = []
        if AsignacionEmp:
            asignaciones = db.query(AsignacionEmp).filter(
                AsignacionEmp.ID_ACCS == usuario_db.ID_ACCS
            ).all()
            ids_emp = [a.ID_EMP for a in asignaciones]
            if ids_emp:
                empresas = db.query(Empresa).filter(Empresa.ID_EMP.in_(ids_emp)).all()
                empresas_usuario = [{
                    "id_emp": emp.ID_EMP,
                    "nombre": emp.NOMBRE,
                    "logo": emp.LOGO,
                    "logo_dark": getattr(emp, 'LOGO_DARK', None),
                } for emp in empresas]


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