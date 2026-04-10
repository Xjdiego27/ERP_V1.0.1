from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    usuario: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=200)
    id_empresa: int


class SeleccionEmpresaRequest(BaseModel):
    id_accs: int
    id_empresa: int