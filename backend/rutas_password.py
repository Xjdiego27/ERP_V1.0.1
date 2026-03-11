# rutas_password.py
# Endpoints para cambio de contraseña con Argon2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from database import get_db, Acceso
from auth_token import verificar_token

router = APIRouter()
ph = PasswordHasher()


def _es_texto_plano(password_hash: str) -> bool:
    """Detecta si un password almacenado es texto plano (no es hash Argon2)."""
    if not password_hash:
        return True
    return not password_hash.startswith("$argon2")


def verificar_password(password_input: str, password_almacenado: str) -> bool:
    """Verifica un password contra el almacenado (soporta plano y Argon2)."""
    if _es_texto_plano(password_almacenado):
        return password_input == password_almacenado
    try:
        return ph.verify(password_almacenado, password_input)
    except VerifyMismatchError:
        return False


def hashear_password(password: str) -> str:
    """Genera hash Argon2id con salt automatico."""
    return ph.hash(password)


# ═══════════════════════════════════════════
#  CAMBIAR CONTRASEÑA (forzado o voluntario)
# ═══════════════════════════════════════════
@router.put("/auth/cambiar-password")
def cambiar_password(datos: dict, token: dict = Depends(verificar_token), db: Session = Depends(get_db)):
    id_accs = token.get("id_accs")
    password_actual = datos.get("password_actual", "")
    password_nuevo = datos.get("password_nuevo", "")
    password_confirm = datos.get("password_confirm", "")

    if not password_nuevo or not password_confirm:
        raise HTTPException(status_code=400, detail="Debes ingresar la nueva contraseña")

    if len(password_nuevo) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    import re
    if not re.search(r'[A-Z]', password_nuevo):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 1 mayúscula")
    if not re.search(r'[a-z]', password_nuevo):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 1 minúscula")
    if not re.search(r'[0-9]', password_nuevo):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 1 número")
    if not re.search(r'[^A-Za-z0-9]', password_nuevo):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 1 carácter especial")

    if password_nuevo != password_confirm:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    if not acceso:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar contraseña actual
    if not verificar_password(password_actual, acceso.PASSWORD):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    # No permitir usar la misma contraseña
    if password_nuevo == password_actual:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente a la actual")

    # Hashear con Argon2 y guardar
    acceso.PASSWORD = hashear_password(password_nuevo)
    acceso.RESET_PASS = 0
    db.commit()

    return {"status": "ok", "mensaje": "Contraseña actualizada correctamente"}
