from pydantic import BaseModel
from typing import Optional

class EmpresaBase(BaseModel):
    ID_EMP: int
    NOMBRE: str
    LOGO: Optional[str] = None
    LOGO_DARK: Optional[str] = None

class EmpresaResponse(EmpresaBase):
    class Config:
        from_attributes = True