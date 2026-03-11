from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    usuario: str
    password: str
    id_empresa: int

class SeleccionEmpresaRequest(BaseModel):
    id_accs: int
    id_empresa: int

class LoginResponse(BaseModel):
    status: str
    mensaje: str
    usuario: Optional[str] = None