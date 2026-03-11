# 📘 DOCUMENTACIÓN COMPLETA — Sistema ERP
## Guía paso a paso para aprender Frontend (React) y Backend (FastAPI)

---

# ═══════════════════════════════════════════════════════════════
# PARTE 1: BACKEND (Python + FastAPI)
# ═══════════════════════════════════════════════════════════════

---

## 📂 Estructura del Backend

```
backend/
├── main.py              ← Punto de entrada, crea el servidor
├── database.py          ← Conexión a la base de datos
├── br_auth.py           ← Lógica de login (validar usuario)
├── auth_token.py        ← Verificar JWT en rutas protegidas
├── rutas_menu.py        ← Endpoints de menú semanal
├── rutas_evento.py      ← Endpoints de eventos
├── rutas_cumpleanos.py  ← Endpoints de cumpleaños
├── rutas_personal.py    ← Endpoints CRUD de empleados
├── schemas/
│   ├── auth_schema.py     ← Esquema del login
│   └── empresa_schema.py  ← Esquema de empresa
```

---

## PASO 1: Instalar las herramientas

### ¿Qué necesitas?
- **Python 3.10+** — El lenguaje de programación
- **MariaDB** — La base de datos (viene con XAMPP)
- **pip** — Instalador de paquetes de Python (ya viene con Python)

### Instalar las librerías:
```
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv pydantic-settings python-jose
```

### ¿Para qué sirve cada librería?
| Librería | ¿Qué hace? |
|----------|-------------|
| **fastapi** | Crea el servidor web (escucha peticiones HTTP) |
| **uvicorn** | Ejecuta el servidor FastAPI |
| **sqlalchemy** | Habla con la base de datos sin escribir SQL |
| **pymysql** | Conector para MySQL/MariaDB |
| **python-dotenv** | Lee variables desde un archivo `.env` |
| **pydantic-settings** | Valida la configuración del servidor |
| **python-jose** | Crea y verifica tokens JWT |

---

## PASO 2: Archivo `.env` — Variables secretas

Crea un archivo `.env` en la carpeta `backend/`:

```env
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=erp

SECRET_KEY=mi_clave_secreta_super_larga_123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### ¿Por qué un archivo `.env`?
- Las contraseñas y claves secretas NUNCA se ponen directo en el código
- Si subes tu código a GitHub, el `.env` se ignora (con `.gitignore`)
- Cada persona puede tener su propio `.env` con sus datos

---

## PASO 3: `database.py` — Conexión a la base de datos

Este archivo hace 3 cosas:
1. Lee las variables del `.env`
2. Se conecta a MariaDB
3. Mapea las tablas de la BD a clases de Python

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# 1. Cargar las variables del archivo .env
load_dotenv()

# 2. Clase que agrupa toda la configuración
class Settings(BaseSettings):
    db_user: str = os.getenv('DB_USER')
    db_password: str = os.getenv('DB_PASSWORD')
    db_host: str = os.getenv('DB_HOST')
    db_port: str = os.getenv('DB_PORT')
    db_name: str = os.getenv('DB_NAME')
    secret_key: str = os.getenv('SECRET_KEY')
    algorithm: str = os.getenv('ALGORITHM')
    access_token_expire_minutes: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))

settings = Settings()

# 3. Armar la URL de conexión: mysql+pymysql://usuario:clave@host:puerto/base_datos
DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

# 4. Crear el motor de conexión
engine = create_engine(DATABASE_URL)

# 5. Crear el "fabricador" de sesiones (cada sesión es una conversación con la BD)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 6. automap_base lee las tablas y crea clases automáticamente
#    Es como hacer: "ve a la BD, mira qué tablas hay, y crea una clase por cada una"
Base = automap_base()
Base.prepare(autoload_with=engine)

# 7. Asignar cada tabla a una variable con nombre legible
Acceso    = Base.classes.acceso
Empresa   = Base.classes.empresa
Personal  = Base.classes.personal
Menu      = Base.classes.menu
Evento    = Base.classes.evento
Contrato  = Base.classes.contrato
Contacto  = Base.classes.contacto
Area      = Base.classes.area
Cargo     = Base.classes.cargo
Documento = Base.classes.documento
EstadoAccs = Base.classes.estado_accs

# 8. Función generadora que da una sesión y la cierra al terminar
def get_db():
    db = SessionLocal()
    try:
        yield db    # "yield" presta la sesión a quien la pida
    finally:
        db.close()  # Siempre cerrar, pase lo que pase
```

### Conceptos clave:
- **`engine`** = La conexión física a la BD (como un cable)
- **`SessionLocal`** = Una fábrica que crea "conversaciones" con la BD
- **`automap_base`** = Lee las tablas y crea clases Python por ti (no necesitas escribir clases manualmente)
- **`yield`** = Presta algo temporalmente. Cuando termina, ejecuta el `finally`
- **`get_db()`** = Cada endpoint pide una sesión, la usa, y se cierra sola

---

## PASO 4: `schemas/` — Validar los datos que llegan

Los schemas definen QUÉ FORMA deben tener los datos. Si alguien manda datos incorrectos, FastAPI los rechaza automáticamente.

### `schemas/auth_schema.py`
```python
from pydantic import BaseModel
from typing import Optional

# Esto dice: "para hacer login, necesito usuario, password y id_empresa"
class LoginRequest(BaseModel):
    usuario: str         # obligatorio, tipo texto
    password: str        # obligatorio, tipo texto
    id_empresa: int      # obligatorio, tipo número entero
```

### `schemas/empresa_schema.py`
```python
from pydantic import BaseModel
from typing import Optional

class EmpresaBase(BaseModel):
    ID_EMP: int
    NOMBRE: str
    LOGO: Optional[str] = None    # Puede ser texto o puede ser None (nulo)

class EmpresaResponse(EmpresaBase):
    class Config:
        from_attributes = True    # Permite convertir objetos de SQLAlchemy a JSON
```

### ¿Por qué usar schemas?
- **Sin schema:** Tú manualmente verificas "¿mandaron usuario? ¿es texto?"
- **Con schema:** Pydantic lo hace solo. Si falta un campo o es del tipo equivocado, responde error 422

---

## PASO 5: `br_auth.py` — Lógica de autenticación

Este archivo valida si el usuario existe, si la contraseña es correcta, y bloquea después de 3 intentos fallidos.

```python
from sqlalchemy.orm import Session
from database import Acceso, Personal

def validar_usuario_br(db, usuario_input, password_input, id_empresa_input):

    # PASO 1: Buscar al usuario en la tabla acceso
    usuario_db = db.query(Acceso).filter(Acceso.USUARIO == usuario_input).first()

    # Si no existe, error
    if not usuario_db:
        return {"status": "error", "mensaje": "USUARIO NO ENCONTRADO"}

    # Si la empresa no coincide, error
    if usuario_db.ID_EMP != int(id_empresa_input):
        return {"status": "error", "mensaje": "EMPRESA INCORRECTA"}

    # Si la cuenta está bloqueada (estado 2), error
    if usuario_db.ID_ESTADO == 2:
        return {"status": "error", "mensaje": "CUENTA BLOQUEADA", "id_estado": 2}

    # PASO 2: Verificar la contraseña
    if usuario_db.PASSWORD == password_input:
        # ✅ Contraseña correcta: reiniciar intentos a 0
        usuario_db.INTENT_LOGIN = 0
        db.commit()

        # Buscar los datos de la persona (nombre, foto, etc)
        personal = db.query(Personal).filter(Personal.ID_ACCS == usuario_db.ID_ACCS).first()

        return {
            "status":   "ok",
            "mensaje":  "EXITO",
            "usuario":  usuario_db.USUARIO,
            "nombre":   personal.NOMBRES     if personal else None,
            "apellido": f"{personal.APE_PATERNO} {personal.APE_MATERNO}" if personal else None,
            "foto":     personal.FOTO        if personal else None,
            "id_area":  usuario_db.ID_ROL,
            "id_accs":  usuario_db.ID_ACCS,
        }

    else:
        # ❌ Contraseña incorrecta: sumar un intento
        intentos = (usuario_db.INTENT_LOGIN or 0) + 1

        # Si ya van 3, bloquear la cuenta
        if intentos >= 3:
            usuario_db.ID_ESTADO = 2
            usuario_db.INTENT_LOGIN = 0
            db.commit()
            return {"status": "error", "mensaje": "DEMASIADOS INTENTOS: CUENTA BLOQUEADA", "id_estado": 2}

        # Si no, guardar el número de intentos
        usuario_db.INTENT_LOGIN = intentos
        db.commit()
        return {"status": "error", "mensaje": f"CLAVE INCORRECTA: {intentos}/3", "id_estado": 1}
```

### Flujo de la validación:
```
¿Existe el usuario?
   NO → "USUARIO NO ENCONTRADO"
   SÍ ↓
¿La empresa coincide?
   NO → "EMPRESA INCORRECTA"
   SÍ ↓
¿Está bloqueado?
   SÍ → "CUENTA BLOQUEADA"
   NO ↓
¿La contraseña es correcta?
   SÍ → Login exitoso, devolver datos
   NO ↓
¿Ya van 3 intentos?
   SÍ → Bloquear cuenta
   NO → Sumar intento: "CLAVE INCORRECTA: 2/3"
```

---

## PASO 6: `main.py` — El servidor principal

Este es el archivo que arranca todo. Crea la aplicación FastAPI, configura CORS, y define las rutas públicas (login y empresa).

```python
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt
from database import get_db, Empresa, settings
from br_auth import validar_usuario_br
from schemas.auth_schema import LoginRequest
from schemas.empresa_schema import EmpresaResponse

# Importar los archivos de rutas
from rutas_menu import router as rutas_menu
from rutas_evento import router as rutas_evento
from rutas_cumpleanos import router as rutas_cumpleanos
from rutas_personal import router as rutas_personal

# 1. Crear la aplicación
app = FastAPI()

# 2. Configurar CORS (permite que el frontend hable con el backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Solo este origen puede llamar
    allow_credentials=True,
    allow_methods=["*"],      # Permite GET, POST, PUT, DELETE
    allow_headers=["*"],      # Permite todos los headers
)

# 3. Registrar las rutas de otros archivos
app.include_router(rutas_menu)
app.include_router(rutas_evento)
app.include_router(rutas_cumpleanos)
app.include_router(rutas_personal)

# 4. Función para crear el JWT (token de acceso)
def crear_token_acceso(data):
    to_encode = data.copy()
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expiracion})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

# 5. Ruta pública: listar empresas (para el select del login)
@app.get("/empresa", response_model=list[EmpresaResponse])
def listar_empresas(db: Session = Depends(get_db)):
    return db.query(Empresa).all()

# 6. Ruta pública: login
@app.post("/auth/login")
async def login(datos: LoginRequest, db: Session = Depends(get_db)):
    # Validar credenciales
    respuesta = validar_usuario_br(db, datos.usuario, datos.password, datos.id_empresa)

    # Obtener logo de la empresa
    empresa = db.query(Empresa).filter(Empresa.ID_EMP == datos.id_empresa).first()
    logo_empresa = empresa.LOGO if empresa else None

    # Si falló, devolver error 401
    if respuesta["status"] == "error":
        raise HTTPException(status_code=401, detail={
            "mensaje": respuesta["mensaje"],
            "id_estado": respuesta.get("id_estado", 1)
        })

    # Si fue exitoso, crear token JWT
    payload = {
        "sub": datos.usuario,         # sub = subject (quién es)
        "area": respuesta.get("id_area"),
        "id_emp": datos.id_empresa
    }
    token = crear_token_acceso(data=payload)

    # Devolver token + datos del usuario al frontend
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "nombre": respuesta.get("nombre"),
            "apellido": respuesta.get("apellido"),
            "foto": respuesta.get("foto"),
            "id_area": respuesta.get("id_area"),
            "id_accs": respuesta.get("id_accs"),
            "id_empresa": datos.id_empresa,
            "logo_empresa": logo_empresa
        }
    }

# 7. Arrancar el servidor
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### ¿Qué es CORS?
El navegador bloquea llamadas entre diferentes orígenes por seguridad:
- Frontend vive en `http://localhost:5173`
- Backend vive en `http://localhost:8000`
- Son orígenes DIFERENTES → el navegador bloquea la llamada
- CORS dice: "hey navegador, deja pasar las llamadas de localhost:5173"

### ¿Qué es JWT?
JWT = JSON Web Token. Es un "pase" que el servidor crea cuando haces login:
```
USUARIO HACE LOGIN
    → Backend verifica usuario/clave
    → Backend crea un token: "este usuario es jvillegas, expira en 60 min"
    → Frontend guarda ese token en localStorage
    → Para cada petición, frontend envía el token
    → Backend verifica: "¿el token es válido? OK, dejo pasar"
```

### ¿Qué es `Depends(get_db)`?
Es "inyección de dependencias". En vez de tú crear la sesión manualmente:
```python
# SIN Depends (manual, repetitivo, y si olvidas cerrar = problemas):
def mi_ruta():
    db = SessionLocal()
    resultado = db.query(Empresa).all()
    db.close()
    return resultado

# CON Depends (automático, se cierra sola):
def mi_ruta(db: Session = Depends(get_db)):
    return db.query(Empresa).all()
```

---

## PASO 7: `auth_token.py` — Proteger rutas con JWT

Este archivo crea una "dependencia" que verifica el token en cada ruta protegida.

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import settings

# Esto le dice a FastAPI: "busca el header Authorization: Bearer <token>"
esquema_seguridad = HTTPBearer()

def verificar_token(credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad)):
    token = credenciales.credentials    # Extraer solo el token (sin "Bearer ")

    try:
        # Decodificar: verificar firma y expiración
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        usuario = payload.get("sub")

        if usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        return payload    # Devolver los datos del token

    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
```

### ¿Cómo se usa?
Agregas `Depends(verificar_token)` a cualquier endpoint:
```python
# ❌ SIN PROTEGER — cualquiera puede llamar esto:
@router.get("/personal")
async def listar_personal(db: Session = Depends(get_db)):
    ...

# ✅ PROTEGIDO — solo con token válido:
@router.get("/personal")
async def listar_personal(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    ...
```

---

## PASO 8: `rutas_menu.py` — Subida de archivos

Este archivo maneja el menú semanal: subir imagen, ver la actual, eliminar.

```python
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db, Menu
from auth_token import verificar_token

router = APIRouter()   # APIRouter permite separar rutas en archivos

# Carpeta donde se guardan las imágenes
MENUS_DIR = os.path.join(os.path.dirname(__file__), "..", "erp-poo", "public", "assets", "menus")
os.makedirs(MENUS_DIR, exist_ok=True)   # Crear la carpeta si no existe

# --- SUBIR IMAGEN ---
@router.post("/menu")
async def subir_menu(id_accs: int, archivo: UploadFile = File(...),
                     db: Session = Depends(get_db),
                     token: dict = Depends(verificar_token)):
    # 1. Crear nombre único con timestamp
    timestamp = int(datetime.now().timestamp())
    nombre_archivo = f"menu_{timestamp}.webp"
    ruta_nueva = os.path.join(MENUS_DIR, nombre_archivo)

    # 2. Borrar foto anterior si existe
    menu_anterior = db.query(Menu).order_by(desc(Menu.FECHA_SUBIDA)).first()
    if menu_anterior:
        ruta_vieja = os.path.join(MENUS_DIR, menu_anterior.ARCHIVO)
        if os.path.exists(ruta_vieja):
            os.remove(ruta_vieja)

    # 3. Guardar foto nueva en disco
    with open(ruta_nueva, "wb") as f:
        shutil.copyfileobj(archivo.file, f)

    # 4. Insertar registro en la BD
    nuevo = Menu(ARCHIVO=nombre_archivo, ID_ACCS=id_accs)
    db.add(nuevo)
    db.commit()

    return {"mensaje": "Menú subido", "archivo": nombre_archivo}

# --- VER IMAGEN ACTUAL ---
@router.get("/menu")
async def ver_menu(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    menu = db.query(Menu).order_by(desc(Menu.FECHA_SUBIDA)).first()
    if menu:
        return {"archivo": menu.ARCHIVO, "url": f"/assets/menus/{menu.ARCHIVO}"}
    return {"archivo": None, "url": None}

# --- ELIMINAR IMAGEN ---
@router.delete("/menu")
async def eliminar_menu(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    menu = db.query(Menu).order_by(desc(Menu.FECHA_SUBIDA)).first()
    if menu:
        ruta = os.path.join(MENUS_DIR, menu.ARCHIVO)
        if os.path.exists(ruta):
            os.remove(ruta)
    return {"mensaje": "Menú eliminado"}
```

### Conceptos clave:
- **`APIRouter()`** = Crea un grupo de rutas que luego se registra con `app.include_router()`
- **`UploadFile`** = FastAPI lo usa para recibir archivos del frontend
- **`shutil.copyfileobj`** = Copia el contenido del archivo subido al disco
- **`desc(Menu.FECHA_SUBIDA)`** = Ordenar por fecha descendente (el más reciente primero)

---

## PASO 9: `rutas_cumpleanos.py` — Consulta con filtros de fecha

```python
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db, Personal
from auth_token import verificar_token

router = APIRouter()

@router.get("/cumpleanos")
async def cumpleanos_mes(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    mes_actual = datetime.now().month

    # extract('month', columna) saca solo el mes de una fecha
    lista = db.query(Personal).filter(
        extract('month', Personal.FECH_NAC) == mes_actual
    ).all()

    resultado = []
    for p in lista:
        resultado.append({
            "nombre": f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            "dia": p.FECH_NAC.day,
            "foto": p.FOTO,
        })

    resultado.sort(key=lambda x: x["dia"])   # Ordenar por día del mes
    return resultado
```

---

## PASO 10: `rutas_personal.py` — CRUD completo

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete (las 4 operaciones básicas).

### Esquema (los datos que acepta el endpoint):
```python
class PersonalSchema(BaseModel):
    nombres: str
    ape_paterno: str
    ape_materno: str
    genero: str
    num_doc: str
    id_doc: Optional[int] = 1
    fech_nac: Optional[str] = None     # Opcional: puede venir vacío
    email: Optional[str] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    id_area: int = 1                   # Tiene valor por defecto
    id_cargo: int = 1
    id_tipocontr: int = 1
```

### READ — Listar empleados:
```python
@router.get("/personal")
async def listar_personal(db, token):
    personas = db.query(Personal).all()
    resultado = []
    for p in personas:
        # Para cada persona, buscar su contrato, acceso, área, cargo, etc.
        contrato = db.query(Contrato).filter(Contrato.ID_PERSONAL == p.ID_PERSONAL).first()
        acceso = db.query(Acceso).filter(Acceso.ID_ACCS == p.ID_ACCS).first()
        # ... armar un diccionario con todos los datos ...
        resultado.append({ "id": p.ID_PERSONAL, "nombres": p.NOMBRES, ... })
    return resultado
```

### CREATE — Crear empleado:
```python
@router.post("/personal")
async def crear_personal(datos: PersonalSchema, db, token):
    # 1. Crear en tabla personal
    nuevo = Personal(
        NOMBRES=datos.nombres,
        APE_PATERNO=datos.ape_paterno,
        ...
    )
    db.add(nuevo)
    db.flush()     # flush = generar el ID sin hacer commit todavía

    # 2. Crear en tabla contrato (necesita el ID del personal)
    contrato = Contrato(
        ID_PERSONAL=nuevo.ID_PERSONAL,
        ID_AREA=datos.id_area,
        ID_CARGO=datos.id_cargo,
        ...
    )
    db.add(contrato)
    db.commit()    # commit = guardar todo de verdad

    return {"mensaje": "Empleado creado", "id": nuevo.ID_PERSONAL}
```

### UPDATE — Actualizar empleado:
```python
@router.put("/personal/{id}")
async def actualizar_personal(id: int, datos: PersonalSchema, db, token):
    # 1. Buscar la persona
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # 2. Actualizar sus campos
    persona.NOMBRES = datos.nombres
    persona.APE_PATERNO = datos.ape_paterno
    # ... etc ...

    # 3. Actualizar su contrato
    contrato = db.query(Contrato).filter(Contrato.ID_PERSONAL == id).first()
    if contrato:
        contrato.ID_AREA = datos.id_area
        contrato.ID_CARGO = datos.id_cargo
    # Si no tiene contrato, crear uno nuevo

    db.commit()
    return {"mensaje": "Empleado actualizado"}
```

### DELETE — Eliminar empleado:
```python
@router.delete("/personal/{id}")
async def eliminar_personal(id: int, db, token):
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Eliminar en ORDEN: primero los hijos, luego el padre
    db.query(Contacto).filter(Contacto.ID_PERSONAL == id).delete()   # Contactos
    db.query(Contrato).filter(Contrato.ID_PERSONAL == id).delete()   # Contrato
    db.delete(persona)                                                 # Persona
    db.commit()

    return {"mensaje": "Empleado eliminado"}
```

### ¿Por qué eliminar en orden?
Las tablas tienen **llaves foráneas** (FK). Si la tabla `contrato` apunta a `personal`, no puedes borrar `personal` primero porque `contrato` se quedaría apuntando a algo que no existe. Por eso se borran los hijos primero.

---

## PASO 11: Ejecutar el backend

```
cd backend
python main.py
```

Esto arranca el servidor en `http://localhost:8000`.
Puedes ver la documentación automática en `http://localhost:8000/docs`.

### Tabla de todos los endpoints:

| Método | Ruta | ¿Protegida? | ¿Qué hace? |
|--------|------|-------------|-------------|
| GET | `/empresa` | ❌ No | Listar empresas (para el login) |
| POST | `/auth/login` | ❌ No | Iniciar sesión |
| GET | `/menu` | ✅ Sí | Ver menú semanal actual |
| POST | `/menu` | ✅ Sí | Subir imagen de menú |
| DELETE | `/menu` | ✅ Sí | Eliminar menú |
| GET | `/evento` | ✅ Sí | Ver evento actual |
| POST | `/evento` | ✅ Sí | Subir imagen de evento |
| DELETE | `/evento` | ✅ Sí | Eliminar evento |
| GET | `/cumpleanos` | ✅ Sí | Cumpleaños del mes |
| GET | `/personal` | ✅ Sí | Listar empleados |
| POST | `/personal` | ✅ Sí | Crear empleado |
| PUT | `/personal/{id}` | ✅ Sí | Actualizar empleado |
| DELETE | `/personal/{id}` | ✅ Sí | Eliminar empleado |
| GET | `/areas` | ✅ Sí | Listar áreas |
| GET | `/cargos` | ✅ Sí | Listar cargos |

---

---

# ═══════════════════════════════════════════════════════════════
# PARTE 2: FRONTEND (React + Vite)
# ═══════════════════════════════════════════════════════════════

---

## 📂 Estructura del Frontend

```
erp-poo/
├── index.html             ← Página HTML principal (punto de entrada)
├── package.json           ← Dependencias del proyecto
├── vite.config.js         ← Configuración de Vite
├── public/
│   └── assets/            ← Imágenes (menús, eventos, logos)
└── src/
    ├── index.jsx          ← Renderiza la App en el HTML
    ├── App.jsx            ← Define las RUTAS de la aplicación
    ├── auth.js            ← Funciones para enviar el JWT
    │
    ├── modules/           ← PÁGINAS completas
    │   ├── Login.jsx         ← Pantalla de login
    │   ├── Dashboard.jsx     ← Layout principal (header + sidebar + contenido)
    │   ├── DashboardHome.jsx ← Página de inicio del dashboard
    │   └── RRHH.jsx          ← Módulo de Recursos Humanos
    │
    ├── components/        ← PIEZAS reutilizables
    │   ├── Header.jsx        ← Barra superior
    │   ├── Sidebar.jsx       ← Menú lateral
    │   ├── CompanyPanel.jsx  ← Panel derecho (menú, eventos, cumpleaños)
    │   ├── SeccionImagen.jsx ← Componente de imagen con upload/delete
    │   ├── SeccionCumpleanos.jsx ← Lista de cumpleaños
    │   ├── ModalImagen.jsx   ← Imagen en pantalla completa
    │   ├── UserMenu.jsx      ← Menú desplegable del usuario
    │   ├── IconoFa.jsx       ← Wrapper de FontAwesome
    │   ├── Img.jsx           ← Componente de imagen
    │   ├── Input.jsx         ← Campo de texto
    │   ├── Label.jsx         ← Etiqueta
    │   ├── Boton.jsx         ← Botón
    │   └── Selector.jsx      ← Select/dropdown
    │
    ├── hooks/             ← LÓGICA reutilizable
    │   ├── useHeader.jsx     ← Lógica del header (leer sesión)
    │   └── useClickAfuera.jsx ← Cerrar menú al clickear afuera
    │
    └── styles/            ← CSS separado por componente
        ├── Login.css
        ├── Dashboard.css
        ├── Header.css
        ├── Sidebar.css
        ├── RRHH.css
        └── ... etc
```

---

## PASO 1: Instalar las herramientas

### ¿Qué necesitas?
- **Node.js 18+** — El runtime de JavaScript (descargarlo de nodejs.org)
- **npm** — Instalador de paquetes (ya viene con Node.js)

### Crear el proyecto:
```
npm create vite@latest erp-poo -- --template react
cd erp-poo
npm install
```

### Instalar dependencias adicionales:
```
npm install react-router-dom
npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
```

### ¿Para qué sirve cada una?
| Librería | ¿Qué hace? |
|----------|-------------|
| **react** | La librería principal para crear interfaces |
| **react-dom** | Conecta React con el navegador |
| **react-router-dom** | Navegación entre páginas SIN recargar |
| **vite** | Servidor de desarrollo + empaquetador rápido |
| **@fortawesome/** | Íconos bonitos (campana, engranaje, etc.) |

---

## PASO 2: `index.html` — El punto de partida

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>ERP</title>
    <!-- Fuente Montserrat de Google -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet">
    <style>
        * { font-family: 'Montserrat', sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>           <!-- Aquí React inyecta toda la app -->
    <script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

### ¿Cómo funciona?
1. El navegador carga `index.html`
2. Ve el `<script>` y carga `index.jsx`
3. `index.jsx` usa ReactDOM para pintar la `<App />` dentro del `<div id="root">`

---

## PASO 3: `index.jsx` + `App.jsx` — Punto de entrada y rutas

### `src/index.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Busca el <div id="root"> en el HTML y pinta <App /> adentro
var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/App.jsx`
```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './modules/Login';
import Dashboard from './modules/Dashboard';
import DashboardHome from './modules/DashboardHome';
import RRHH from './modules/RRHH';

function App() {
    return (
        <div className='App'>
            <Router>
                <Routes>
                    {/* Ruta raíz: pantalla de login */}
                    <Route path="/" element={<Login />} />

                    {/* Dashboard: layout con header+sidebar, con hijos */}
                    <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="rrhh" element={<RRHH />} />
                    </Route>

                    {/* Cualquier otra ruta: redirigir al login */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
```

### ¿Qué son las rutas anidadas?
```
/dashboard           → Muestra Dashboard (header+sidebar) + DashboardHome (dentro del Outlet)
/dashboard/rrhh      → Muestra Dashboard (header+sidebar) + RRHH (dentro del Outlet)
```

Es como una página con un "marco" fijo (header+sidebar) y un "hueco" (`<Outlet />`) donde se cambia el contenido.

---

## PASO 4: `auth.js` — Enviar el JWT en cada petición

```javascript
// Obtener el token del localStorage
function obtenerToken() {
  var session = JSON.parse(localStorage.getItem('session'));
  if (session && session.access_token) {
    return session.access_token;
  }
  return null;
}

// Para peticiones JSON (POST/PUT con body)
function headersConToken() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + obtenerToken(),
  };
}

// Para peticiones sin body (GET, DELETE) o con FormData (subir archivos)
function headersAuth() {
  return {
    'Authorization': 'Bearer ' + obtenerToken(),
  };
}

export { obtenerToken, headersConToken, headersAuth };
```

### ¿Cuándo usar cada uno?
| Función | ¿Cuándo? | Ejemplo |
|---------|----------|---------|
| `headersConToken()` | Envías JSON en el body | POST/PUT con `JSON.stringify(datos)` |
| `headersAuth()` | No envías JSON | GET, DELETE, o subir archivos con FormData |

### ¿Por qué FormData NO usa `Content-Type`?
Cuando subes un archivo con FormData, el navegador agrega automáticamente:
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```
Si tú pones `Content-Type: application/json`, se rompe. Por eso FormData usa `headersAuth()` que solo tiene el token.

---

## PASO 5: `Login.jsx` — Pantalla de login

Este es el flujo completo del login:

```
1. El componente carga → useEffect llama GET /empresa → llena el select de empresas
2. Si ya hay sesión en localStorage → navigate("/dashboard") automáticamente
3. Usuario llena formulario y hace clic en "Ingresar"
4. iniciarSesion() llama POST /auth/login con { usuario, password, id_empresa }
5. Si responde OK → guarda todo en localStorage → navigate("/dashboard")
6. Si responde error → muestra mensaje ("CLAVE INCORRECTA: 2/3")
```

### Datos que se guardan en localStorage:
```javascript
localStorage.setItem('session', JSON.stringify({
    access_token: "eyJhbGciOi...",    // El JWT
    token_type: "bearer",
    usuario: {
        nombre: "Juan",
        apellido: "Villegas Perez",
        foto: "fotos/juan.jpg",
        id_area: 1,
        id_accs: 5,
        id_empresa: 1,
        logo_empresa: "logos/empresa1.png"
    }
}));
```

### Tema dinámico por empresa:
```jsx
// Cuando el usuario elige una empresa en el select, se carga su CSS de tema
useEffect(() => {
    if (!empresaElegida) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/TemaEmpresa' + empresaElegida + '.css';
    document.head.appendChild(link);
}, [empresaElegida]);
```
Si elige empresa 1 → carga `TemaEmpresa1.css`
Si elige empresa 2 → carga `TemaEmpresa2.css`

---

## PASO 6: `Dashboard.jsx` — Layout principal

```jsx
export default function Dashboard() {
    var [usuario, setUsuario] = useState(null);
    var [sidebarOpen, setSidebarOpen] = useState(true);
    var [empresaOpen, setEmpresaOpen] = useState(false);
    var navigate = useNavigate();

    // Protección de ruta: si no hay sesión, mandar al login
    useEffect(function () {
        var session = JSON.parse(localStorage.getItem('session'));
        if (session && session.usuario) {
            setUsuario(session.usuario);
        } else {
            navigate("/");    // No hay sesión → fuera
        }
    }, [navigate]);

    if (!usuario) return <p>Cargando sesión...</p>;

    return (
        <div className="dashboard-layout">
            <Header />
            <div className="dashboard-body">
                <Sidebar />
                <div className="workspace-area">
                    <Outlet />    {/* ← AQUÍ se pinta DashboardHome o RRHH */}
                </div>
                <CompanyPanel />  {/* Panel derecho: menú, eventos, cumpleaños */}
            </div>
        </div>
    );
}
```

### ¿Qué es `<Outlet />`?
Es un "hueco" donde React Router pinta el componente hijo según la URL:
```
URL = /dashboard        → <Outlet /> pinta <DashboardHome />
URL = /dashboard/rrhh   → <Outlet /> pinta <RRHH />
```

### Layout visual:
```
┌─────────────────────────────────────────────────┐
│  HEADER (logo, campana, nombre, foto usuario)   │
├──────┬──────────────────────────┬───────────────┤
│      │                          │               │
│ SIDE │     <Outlet />           │  COMPANY      │
│ BAR  │   (contenido central)    │  PANEL        │
│      │                          │  (menú,       │
│      │                          │   eventos,    │
│      │                          │   cumpleaños) │
│      │                          │               │
└──────┴──────────────────────────┴───────────────┘
```

---

## PASO 7: `Header.jsx` — Barra superior

```jsx
export default function Header({ onToggleMenu, onToggleEmpresa }) {
    // useHeader() lee la sesión del localStorage y devuelve los datos
    var { usuario, menuOpen, toggleMenu, closeMenu } = useHeader();

    return (
        <header className="erp-header">
            {/* Izquierda: Logo de la empresa (clickeable, va al dashboard) */}
            <div className="header-left" onClick={function () { navigate('/dashboard'); }}>
                <Img ruta={usuario.logo} />
            </div>

            {/* Derecha: campana + configuración + nombre + foto */}
            <div className="header-right">
                <IconoFa icono={faBell} />      {/* Campana de notificaciones */}
                <IconoFa icono={faGear} />      {/* Engranaje de configuración */}
                <span>{usuario.nombreCompleto}</span>
                <div onClick={toggleMenu}>
                    <Img ruta={usuario.foto} />   {/* Click abre UserMenu */}
                </div>
                {menuOpen && <UserDropdown />}     {/* Dropdown con "Cerrar sesión" */}
            </div>
        </header>
    );
}
```

### Hooks personalizados:

**`useHeader.jsx`** — Lee la sesión del localStorage:
```jsx
export function useHeader() {
    var [usuario, setUsuario] = useState(null);
    var [menuOpen, setMenuOpen] = useState(false);

    useEffect(function () {
        var session = JSON.parse(localStorage.getItem('session'));
        if (session && session.usuario) {
            setUsuario({
                nombreCompleto: session.usuario.nombre + ' ' + session.usuario.apellido,
                cargo: session.usuario.cargo || 'Cargo no definido',
                foto: session.usuario.foto,
                logo: '/assets/' + session.usuario.logo_empresa,
            });
        }
    }, []);

    return { usuario, menuOpen, toggleMenu, closeMenu };
}
```

**`useClickAfuera.jsx`** — Cierra un menú cuando clickeas fuera de él:
```jsx
export function useClickAfuera(panel, accion) {
    useEffect(function () {
        var listener = function (evento) {
            // Si el click fue DENTRO del panel, no hacer nada
            if (!panel.current || panel.current.contains(evento.target)) {
                return;
            }
            // Si fue AFUERA, ejecutar la acción (cerrar menú)
            accion(evento);
        };
        document.addEventListener('mousedown', listener);
        return function () { document.removeEventListener('mousedown', listener); };
    }, [panel, accion]);
}
```

---

## PASO 8: `Sidebar.jsx` — Menú lateral

```jsx
export default function Sidebar({ isOpen, onToggleMenu }) {
    var menuItems = [
        { nombre: 'Inicio',     ruta: '/dashboard',            icono: faHouse },
        { nombre: 'RRHH',       ruta: '/dashboard/rrhh',       icono: faFileLines },
        { nombre: 'Inventario', ruta: '/dashboard/inventario',  icono: faBoxArchive },
        { nombre: 'Clientes',   ruta: '/dashboard/clientes',    icono: faUsers },
    ];

    return (
        <aside className={'sidebar ' + (isOpen ? 'open' : 'collapsed')}>
            <button onClick={onToggleMenu}>
                <IconoFa icono={faBars} />
            </button>

            <nav>
                {menuItems.map(function (item) {
                    return (
                        <Link to={item.ruta} className={location.pathname === item.ruta ? 'active' : ''}>
                            <IconoFa icono={item.icono} />
                            {isOpen && <span>{item.nombre}</span>}
                        </Link>
                    );
                })}
            </nav>

            <button onClick={cerrarSesion}>
                <IconoFa icono={faRightFromBracket} />
                {isOpen && <span>Cerrar sesión</span>}
            </button>
        </aside>
    );
}
```

### ¿Cómo funciona el sidebar colapsado?
- `isOpen = true` → clase `open` → sidebar ancho con textos
- `isOpen = false` → clase `collapsed` → sidebar angosto solo con íconos
- `{isOpen && <span>nombre</span>}` → El texto solo aparece cuando está abierto

---

## PASO 9: `CompanyPanel.jsx` — Panel de empresa

```jsx
export default function CompanyPanel({ isOpen, onClose, idRol, idAccs }) {
    var [menuUrl, setMenuUrl] = useState(null);
    var [eventoUrl, setEventoUrl] = useState(null);
    var [cumpleanos, setCumpleanos] = useState([]);
    var [imagenGrande, setImagenGrande] = useState(null);

    var esAdmin = (idRol === 1);

    // Cada vez que se abre, traer los datos del backend
    useEffect(function () {
        if (!isOpen) return;
        fetch('http://localhost:8000/menu', { headers: headersAuth() })
            .then(function (res) { return res.json(); })
            .then(function (data) { setMenuUrl(data.url + '?t=' + Date.now()); });
        // ... lo mismo para /evento y /cumpleanos
    }, [isOpen]);

    return (
        <AsidePanel isOpen={isOpen}>
            <SeccionImagen label="Menú Semanal" url={menuUrl} esAdmin={esAdmin} tipo="menu" ... />
            <SeccionImagen label="Eventos" url={eventoUrl} esAdmin={esAdmin} tipo="evento" ... />
            <SeccionCumpleanos cumpleanos={cumpleanos} />
            <ModalImagen url={imagenGrande} onCerrar={function () { setImagenGrande(null); }} />
        </AsidePanel>
    );
}
```

### ¿Qué es `?t=Date.now()`?
Es un truco para evitar la caché del navegador. Si la URL es siempre `/menus/menu_123.webp`, el navegador dice "ya tengo esa imagen" y no la descarga de nuevo. Al agregar `?t=1708000000` la URL cambia y el navegador la trata como nueva.

---

## PASO 10: `SeccionImagen.jsx` — Componente reutilizable

Este componente se usa tanto para "Menú Semanal" como para "Eventos". Recibe props y se adapta.

```jsx
export default function SeccionImagen(props) {
    // Props: label, url, esAdmin, tipo, idAccs, onCambio, onVerGrande

    var inputRef = useRef(null);    // Referencia al input oculto

    // --- SUBIR IMAGEN ---
    async function subir(e) {
        var archivo = e.target.files[0];
        var formData = new FormData();
        formData.append('archivo', archivo);

        var respuesta = await fetch('http://localhost:8000/' + props.tipo + '?id_accs=' + props.idAccs, {
            method: 'POST',
            headers: headersAuth(),    // Solo Authorization, SIN Content-Type
            body: formData,
        });

        var data = await respuesta.json();
        if (data.archivo) {
            props.onCambio('/assets/' + carpeta + '/' + data.archivo + '?t=' + Date.now());
        }
    }

    // --- ELIMINAR IMAGEN ---
    async function eliminar() {
        await fetch('http://localhost:8000/' + props.tipo, {
            method: 'DELETE',
            headers: headersAuth(),
        });
        props.onCambio(null);
    }

    return (
        <div>
            <h4>{props.label}</h4>
            {/* Si hay imagen, mostrarla. Si no, "Sin imagen" */}
            {props.url ? (
                <img src={props.url} onClick={function () { props.onVerGrande(props.url); }} />
            ) : (
                <div>Sin imagen</div>
            )}

            {/* Botón eliminar: solo si es admin Y hay imagen */}
            {props.esAdmin && props.url && (
                <button onClick={eliminar}><IconoFa icono={faXmark} /></button>
            )}

            {/* Botón subir: solo si es admin */}
            {props.esAdmin && (
                <div>
                    <input type="file" ref={inputRef} onChange={subir} hidden />
                    <button onClick={function () { inputRef.current.click(); }}>
                        <IconoFa icono={faCamera} />
                    </button>
                </div>
            )}
        </div>
    );
}
```

### ¿Qué es `useRef`?
`useRef` crea una referencia a un elemento del DOM. Aquí se usa para el input de archivo:
```jsx
var inputRef = useRef(null);

// El input está oculto con CSS
<input type="file" ref={inputRef} onChange={subir} />

// El botón visible activa el input oculto al clickearlo
<button onClick={function () { inputRef.current.click(); }}>
```
Así el usuario ve un botón bonito, no el input feo de "Elegir archivo".

---

## PASO 11: `RRHH.jsx` — Módulo completo con CRUD

Este es el módulo más grande. Tiene:
- Panel izquierdo: perfil del empleado
- Panel derecho: tabs (Resumen, Contratos, Documentos, etc.)
- Tres modos: **VER** / **EDITAR** / **CREAR**

### Estados:
```jsx
var [personal, setPersonal] = useState([]);            // Lista de empleados
var [seleccionado, setSeleccionado] = useState(null);  // El empleado que estás viendo
var [tabActiva, setTabActiva] = useState('resumen');   // Qué tab está activa
var [editando, setEditando] = useState(false);         // ¿Modo edición?
var [creando, setCreando] = useState(false);           // ¿Creando uno nuevo?
var [datos, setDatos] = useState({});                  // Datos temporales del formulario
var [areas, setAreas] = useState([]);                  // Lista de áreas para select
var [cargos, setCargos] = useState([]);                // Lista de cargos para select
```

### Flujo de modos:

```
┌─────────────────┐
│   MODO VER      │  ← Estado inicial
│                 │
│  [Editar] [Nuevo] [Eliminar]
│                 │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ EDITAR  │ │  CREAR   │
│         │ │          │
│ Carga   │ │ Limpia   │
│ datos   │ │ formulario│
│ actuales│ │          │
│         │ │          │
│ [Guardar] [Cancelar] │
└─────────┘ └──────────┘
     │            │
     │   PUT      │   POST
     ▼            ▼
   Backend ← → Backend
     │            │
     └────┬───────┘
          ▼
    RECARGAR LISTA
          │
          ▼
    VOLVER A MODO VER
```

### Función `guardarDatos()` — El truco del closure:
```jsx
function guardarDatos() {
    // TRUCO: guardar si estaba creando ANTES de limpiar el estado
    var eraCreando = creando;
    var idActual = seleccionado ? seleccionado.id : null;

    // Determinar URL y método
    var url = eraCreando
        ? 'http://localhost:8000/personal'
        : 'http://localhost:8000/personal/' + idActual;
    var metodo = eraCreando ? 'POST' : 'PUT';

    // Limpiar datos: convertir campos vacíos a null o defaults
    var datosLimpios = Object.assign({}, datos);
    if (!datosLimpios.id_area)  datosLimpios.id_area = 1;
    if (!datosLimpios.id_cargo) datosLimpios.id_cargo = 1;
    if (datosLimpios.fech_nac === '') datosLimpios.fech_nac = null;

    fetch(url, {
        method: metodo,
        headers: headersConToken(),     // JSON + Authorization
        body: JSON.stringify(datosLimpios),
    })
    .then(function (res) { return res.json(); })
    .then(function (resp) {
        alert(resp.mensaje);
        setEditando(false);
        setCreando(false);
        // Recargar la lista y seleccionar el correcto
        fetch('http://localhost:8000/personal', { headers: headersAuth() })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                setPersonal(data);
                if (eraCreando && resp.id) {
                    var nuevo = data.find(function (p) { return p.id === resp.id; });
                    setSeleccionado(nuevo || data[0]);
                } else {
                    var actualizado = data.find(function (p) { return p.id === idActual; });
                    setSeleccionado(actualizado || data[0]);
                }
            });
    });
}
```

### ¿Por qué `eraCreando`?
Cuando el `.then()` se ejecuta, ya pasó tiempo y React puede haber cambiado `creando` a `false`. Si usas `creando` directamente, siempre sería `false`. Por eso guardamos el valor en una variable local ANTES de limpiar.

### Renderizado condicional (modo VER vs EDITAR):
```jsx
{/* MODO VER: textos planos */}
{!editando && seleccionado && (
    <div>
        <label>Nombre</label>
        <span className="rrhh-valor">{seleccionado.nombres}</span>
    </div>
)}

{/* MODO EDITAR: inputs editables */}
{editando && (
    <div>
        <label>Nombres</label>
        <input
            className="rrhh-input rrhh-input-editable"
            value={datos.nombres}
            onChange={function (e) { cambiarCampo('nombres', e.target.value); }}
        />
    </div>
)}
```

---

## PASO 12: Componentes pequeños reutilizables

### `IconoFa.jsx` — Wrapper de FontAwesome:
```jsx
export default function IconoFa({ icono, tamaño, clase }) {
    return <FontAwesomeIcon icon={icono} size={tamaño || '1x'} className={'icono-base ' + (clase || '')} />;
}
```
En vez de escribir `<FontAwesomeIcon icon={faBell} size="1x" />` en todos lados, escribes `<IconoFa icono={faBell} />`.

### `ModalImagen.jsx` — Imagen en pantalla completa:
```jsx
export default function ModalImagen(props) {
    if (!props.url) return null;    // Si no hay URL, no mostrar nada

    return (
        <div className="modal-fondo" onClick={props.onCerrar}>
            <img src={props.url} className="modal-imagen" />
        </div>
    );
}
```

### `SeccionCumpleanos.jsx`:
```jsx
export default function SeccionCumpleanos(props) {
    var meses = ['Enero', 'Febrero', ...];
    var mesActual = meses[new Date().getMonth()];

    if (props.cumpleanos.length === 0) {
        return <p>No hay cumpleaños este mes.</p>;
    }

    return (
        <ul>
            {props.cumpleanos.map(function (persona, i) {
                return <li key={i}>{persona.dia} - {persona.nombre}</li>;
            })}
        </ul>
    );
}
```

---

## PASO 13: Ejecutar el frontend

```
cd erp-poo
npm run dev
```

Esto arranca Vite en `http://localhost:5173`.

---

---

# ═══════════════════════════════════════════════════════════════
# PARTE 3: CÓMO SE CONECTAN FRONT Y BACK
# ═══════════════════════════════════════════════════════════════

---

## El flujo completo de una petición:

```
┌──────────────────────┐         ┌──────────────────────┐         ┌────────────┐
│     NAVEGADOR        │         │     SERVIDOR         │         │   BASE DE  │
│    (React/Vite)      │         │    (FastAPI)          │         │   DATOS    │
│  localhost:5173      │         │  localhost:8000       │         │  (MariaDB) │
│                      │         │                      │         │            │
│  1. Usuario hace     │         │                      │         │            │
│     clic en "RRHH"   │         │                      │         │            │
│         │            │         │                      │         │            │
│  2. useEffect se     │         │                      │         │            │
│     ejecuta          │         │                      │         │            │
│         │            │         │                      │         │            │
│  3. fetch() envía:   │────────>│  4. FastAPI recibe    │         │            │
│     GET /personal    │  HTTP   │     la petición       │         │            │
│     Authorization:   │         │         │             │         │            │
│     Bearer eyJ...    │         │  5. verificar_token   │         │            │
│                      │         │     valida el JWT     │         │            │
│                      │         │         │             │         │            │
│                      │         │  6. Depends(get_db)   │────────>│  7. SQL:   │
│                      │         │     abre sesión BD    │         │  SELECT *  │
│                      │         │         │             │<────────│  FROM      │
│                      │         │  8. Arma el JSON      │         │  personal  │
│  10. setPersonal(    │<────────│  9. return resultado  │         │            │
│      data)           │  JSON   │                      │         │            │
│         │            │         │                      │         │            │
│  11. React re-render │         │                      │         │            │
│      pinta la lista  │         │                      │         │            │
│                      │         │                      │         │            │
└──────────────────────┘         └──────────────────────┘         └────────────┘
```

---

## Mapa de fetch() del frontend → endpoints del backend:

| Componente | fetch() | Endpoint backend |
|------------|---------|-----------------|
| **Login.jsx** | POST /auth/login | main.py → login() |
| **Login.jsx** | GET /empresa | main.py → listar_empresas() |
| **CompanyPanel.jsx** | GET /menu | rutas_menu.py → ver_menu() |
| **CompanyPanel.jsx** | GET /evento | rutas_evento.py → ver_evento() |
| **CompanyPanel.jsx** | GET /cumpleanos | rutas_cumpleanos.py → cumpleanos_mes() |
| **SeccionImagen.jsx** | POST /menu o /evento | rutas_menu/evento.py → subir_*() |
| **SeccionImagen.jsx** | DELETE /menu o /evento | rutas_menu/evento.py → eliminar_*() |
| **RRHH.jsx** | GET /personal | rutas_personal.py → listar_personal() |
| **RRHH.jsx** | GET /areas | rutas_personal.py → listar_areas() |
| **RRHH.jsx** | GET /cargos | rutas_personal.py → listar_cargos() |
| **RRHH.jsx** | POST /personal | rutas_personal.py → crear_personal() |
| **RRHH.jsx** | PUT /personal/{id} | rutas_personal.py → actualizar_personal() |
| **RRHH.jsx** | DELETE /personal/{id} | rutas_personal.py → eliminar_personal() |

---

## Seguridad — ¿Qué está protegido y qué no?

| Capa | Mecanismo | ¿Dónde está? |
|------|-----------|--------------|
| **Variables secretas** | Archivo `.env` (nunca en el código) | backend/.env |
| **CORS** | Solo `localhost:5173` puede llamar al backend | main.py |
| **Bloqueo de cuenta** | 3 intentos fallidos → cuenta bloqueada | br_auth.py |
| **JWT** | Token de 60 min que se envía en cada petición | auth_token.py + auth.js |
| **Validación** | Pydantic rechaza datos con formato incorrecto | schemas/ |
| **ORM** | SQLAlchemy evita inyección SQL | database.py |
| **Rutas protegidas** | 13 de 15 endpoints exigen token | Depends(verificar_token) |

---

---

# ═══════════════════════════════════════════════════════════════
# PARTE 4: GLOSARIO RÁPIDO
# ═══════════════════════════════════════════════════════════════

| Término | Significado simple |
|---------|-------------------|
| **API** | "Puerta" del backend por donde entran y salen datos |
| **Endpoint** | Una URL específica de la API (ej: `/personal`) |
| **fetch()** | Función de JavaScript para llamar a una API |
| **JSON** | Formato de texto para enviar datos: `{"nombre": "Juan"}` |
| **JWT** | "Pase" digital que demuestra que hiciste login |
| **CORS** | Permiso del backend para que el frontend le hable |
| **CRUD** | Create + Read + Update + Delete (las 4 operaciones) |
| **ORM** | Herramienta que traduce Python a SQL automáticamente |
| **Schema** | Plantilla que define la forma correcta de los datos |
| **useState** | Variable de React que al cambiar re-pinta el componente |
| **useEffect** | Código que se ejecuta cuando el componente carga o algo cambia |
| **useRef** | Referencia a un elemento HTML (ej: un input oculto) |
| **Props** | Datos que un componente padre le pasa a un hijo |
| **Outlet** | "Hueco" en el layout donde React Router pinta el hijo |
| **Navigate** | Redirigir al usuario a otra página sin recargar |
| **FormData** | "Sobre" para enviar archivos por HTTP |
| **Depends** | Inyección de dependencias: FastAPI da la sesión BD automáticamente |
| **flush()** | Ejecutar SQL sin guardar definitivamente (para obtener el ID) |
| **commit()** | Guardar todos los cambios en la base de datos |
| **yield** | Prestar algo temporalmente, y ejecutar limpieza al final |
| **automap** | SQLAlchemy lee las tablas y crea clases Python automáticamente |

---

## ¿Cómo estudiar esto?

1. **Empieza por `database.py`** — Entiende cómo se conecta a la BD
2. **Sigue con `main.py`** — Ve cómo se crea el servidor y la ruta de login
3. **Luego `br_auth.py`** — Entiende la lógica de validación
4. **Luego `auth_token.py`** — Entiende cómo se protegen las rutas
5. **Luego `rutas_menu.py`** — Un CRUD simple (solo 3 endpoints)
6. **Luego `rutas_personal.py`** — Un CRUD completo
7. **En el front, empieza con `App.jsx`** — Las rutas
8. **Luego `Login.jsx`** — El formulario y la llamada al backend
9. **Luego `Dashboard.jsx`** — El layout con Outlet
10. **Luego `CompanyPanel.jsx` + `SeccionImagen.jsx`** — Fetch + subida de archivos
11. **Finalmente `RRHH.jsx`** — CRUD completo en el frontend

Cada archivo es un paso más de complejidad. Si entiendes uno, el siguiente será más fácil. 💪
