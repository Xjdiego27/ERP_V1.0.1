# ============================================
# chat_auth.py — Autenticación JWT para chat
# ============================================
import logging
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from chat_config import SECRET_KEY, ALGORITHM
from chat_db import SessionLocal, Personal

logger = logging.getLogger("chat")

esquema_seguridad = HTTPBearer()


def verificar_token(credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad)):
    """Valida el JWT y retorna el payload."""
    token = credenciales.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario = payload.get("sub")
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")


def resolver_id_personal(payload):
    """Obtiene id_personal del token JWT o buscando en la BD."""
    id_personal = payload.get("id_personal")
    nombre = payload.get("nombre", "Usuario")
    if id_personal:
        return id_personal, nombre

    id_accs = payload.get("id_accs")
    if not id_accs:
        return None, nombre

    db = SessionLocal()
    try:
        personal = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
        if personal:
            return personal.ID_PERSONAL, f"{personal.NOMBRES} {personal.APE_PATERNO}"
    finally:
        db.close()
    return None, nombre
