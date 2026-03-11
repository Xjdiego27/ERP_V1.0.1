import os
import uvicorn
import traceback
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import get_db, Empresa, Acceso, Personal, RolAccs, AsignacionEmp, settings
from br_auth import validar_usuario_br
from auth_token import verificar_token, crear_token_acceso
from helpers import construir_respuesta_usuario
from schemas.auth_schema import LoginRequest, SeleccionEmpresaRequest
from schemas.empresa_schema import EmpresaResponse

# Rutas separadas por responsabilidad
from rutas_menu import router as rutas_menu
from rutas_evento import router as rutas_evento
from rutas_cumpleanos import router as rutas_cumpleanos
from rutas_catalogos import router as rutas_catalogos
from rutas_personal import router as rutas_personal
from rutas_historial import router as rutas_historial
from rutas_asistencia import router as rutas_asistencia
from rutas_horario import router as rutas_horario
from rutas_notificaciones import router as rutas_notificaciones
from rutas_documentos import router as rutas_documentos
from rutas_password import router as rutas_password
from rutas_equipo import router as rutas_equipo
from rutas_tickets import router as rutas_tickets

load_dotenv()

app = FastAPI()

# Middleware para loguear errores 500
@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

# CORS — origenes permitidos desde .env + acceso LAN automatico
cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
cors_origins = [o.strip() for o in cors_env]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # Permitir cualquier IP privada de red local automaticamente
    allow_origin_regex=r'https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(rutas_menu)
app.include_router(rutas_evento)
app.include_router(rutas_cumpleanos)
app.include_router(rutas_catalogos)
app.include_router(rutas_personal)
app.include_router(rutas_historial)
app.include_router(rutas_asistencia)
app.include_router(rutas_horario)
app.include_router(rutas_notificaciones)
app.include_router(rutas_documentos)
app.include_router(rutas_password)
app.include_router(rutas_equipo)
app.include_router(rutas_tickets)


# ── Helpers locales ──────────────────────────────
def _generar_token(acceso, id_empresa, rol):
    """Construye payload y firma el JWT."""
    return crear_token_acceso({
        "sub": acceso.USUARIO,
        "id_accs": acceso.ID_ACCS,
        "id_emp": id_empresa,
        "rol": rol.DESCRIP if rol else None,
    })


def _verificar_asignacion(db, id_accs, id_empresa):
    """Lanza 403 si el usuario no está asignado a la empresa."""
    if not AsignacionEmp:
        return
    asignacion = db.query(AsignacionEmp).filter(
        AsignacionEmp.ID_ACCS == id_accs,
        AsignacionEmp.ID_EMP == id_empresa,
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail={"mensaje": "No tienes acceso a esta empresa", "id_estado": 1},
        )


# ── EMPRESAS ─────────────────────────────────────
@app.get("/empresa", response_model=list[EmpresaResponse])
def listar_empresas(db: Session = Depends(get_db)):
    return db.query(Empresa).order_by(Empresa.NOMBRE).all()


# ── LOGIN PASO 1: Validar credenciales + empresa → JWT ──
@app.post("/auth/login")
async def login(datos: LoginRequest, db: Session = Depends(get_db)):

    # 1. Validar credenciales
    respuesta = validar_usuario_br(db, datos.usuario, datos.password)
    if respuesta["status"] == "error":
        raise HTTPException(
            status_code=401,
            detail={
                "mensaje": respuesta["mensaje"],
                "id_estado": respuesta.get("id_estado", 1),
            },
        )

    id_accs = respuesta["id_accs"]

    # 2. Verificar asignación a la empresa
    _verificar_asignacion(db, id_accs, datos.id_empresa)

    empresa = db.query(Empresa).filter(Empresa.ID_EMP == datos.id_empresa).first()
    if not empresa:
        raise HTTPException(status_code=404, detail={"mensaje": "Empresa no encontrada", "id_estado": 1})

    # 3. Generar token
    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    rol = db.query(RolAccs).filter(RolAccs.ID_ROL == acceso.ID_ROL).first()
    token = _generar_token(acceso, datos.id_empresa, rol)

    # 4. Respuesta completa
    return {
        "access_token": token,
        "token_type": "bearer",
        "requiere_cambio_password": respuesta.get("requiere_cambio_password", False),
        "usuario": construir_respuesta_usuario(db, acceso, datos.id_empresa),
    }


# ── LOGIN PASO 2: Seleccionar empresa → JWT ─────
@app.post("/auth/seleccionar-empresa")
async def seleccionar_empresa(datos: SeleccionEmpresaRequest, db: Session = Depends(get_db)):

    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == datos.id_accs).first()
    if not acceso:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    _verificar_asignacion(db, datos.id_accs, datos.id_empresa)

    empresa = db.query(Empresa).filter(Empresa.ID_EMP == datos.id_empresa).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    rol = db.query(RolAccs).filter(RolAccs.ID_ROL == acceso.ID_ROL).first()
    token = _generar_token(acceso, datos.id_empresa, rol)

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": construir_respuesta_usuario(db, acceso, datos.id_empresa),
    }


# ── VERIFICAR SESIÓN (devuelve datos frescos del usuario) ──
@app.get("/auth/verificar")
def verificar_sesion(token: dict = Depends(verificar_token), db: Session = Depends(get_db)):
    id_accs = token.get("id_accs")
    id_emp = token.get("id_emp")

    acceso = db.query(Acceso).filter(Acceso.ID_ACCS == id_accs).first()
    if not acceso:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return {
        "valido": True,
        "usuario": construir_respuesta_usuario(db, acceso, id_emp),
    }


if __name__ == "__main__":
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("main:app", host=api_host, port=api_port, reload=True)
