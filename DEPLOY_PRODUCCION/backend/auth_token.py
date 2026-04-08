# auth_token.py
# Responsabilidad: Creación y verificación de tokens JWT.
# Se usa como dependencia en todas las rutas protegidas.

from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import settings

# Esquema que busca el header: Authorization: Bearer <token>
esquema_seguridad = HTTPBearer()


# ── Crear token ───────────────────────────
def crear_token_acceso(data: dict) -> str:
    """Genera un JWT firmado con expiración configurable."""
    to_encode = data.copy()
    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expiracion})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


# ── Verificar token (dependencia FastAPI) ─
def verificar_token(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad),
):
    token = credenciales.credentials

    try:
        # Decodificar el token con la misma clave y algoritmo que se usó al crearlo
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        usuario = payload.get("sub")

        # Si no tiene usuario dentro, es inválido
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
