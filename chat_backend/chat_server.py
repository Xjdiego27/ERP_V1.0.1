# ============================================
# CHAT BACKEND — Servidor independiente (puerto 8001)
#
# Conecta a la misma BD MySQL (ERP) y MongoDB.
# Usa el MISMO JWT del ERP principal para autenticar.
# Socket.IO para mensajería en tiempo real.
#
# ARQUITECTURA: socketio.ASGIApp wraps FastAPI
# Socket.IO maneja /socket.io/* (WebSocket + polling)
# FastAPI maneja todo lo demás (/contactos, /mensajes, etc.)
# ============================================

import os
from dotenv import load_dotenv

# Cargar el .env del backend principal
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

import uvicorn
import time
import logging
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import socketio
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chat")


# ══════════════════════════════════════════════════════════
# CONFIGURACIÓN — Lee las mismas variables del ERP
# ══════════════════════════════════════════════════════════
DB_HOST     = os.getenv('DB_HOST', 'localhost')
DB_USER     = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME     = os.getenv('DB_NAME', 'erp')
DB_PORT     = os.getenv('DB_PORT', '3306')

SECRET_KEY  = os.getenv('SECRET_KEY')
ALGORITHM   = os.getenv('ALGORITHM', 'HS256')

MONGO_URL     = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'erp_nosql')

CHAT_PORT = int(os.getenv('CHAT_PORT', '8001'))


# ══════════════════════════════════════════════════════════
# BASE DE DATOS MySQL — Misma BD del ERP (solo lectura)
# ══════════════════════════════════════════════════════════
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = automap_base()
Base.prepare(autoload_with=engine)

Personal  = Base.classes.personal
Acceso    = Base.classes.acceso
Contrato  = Base.classes.contrato
Cargo     = Base.classes.cargo

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ══════════════════════════════════════════════════════════
# MONGODB — Colección de mensajes de chat
# ══════════════════════════════════════════════════════════
cliente_mongo = AsyncIOMotorClient(MONGO_URL)
db_mongo = cliente_mongo[MONGO_DB_NAME]
coleccion_mensajes = db_mongo["chat_mensajes"]


# ══════════════════════════════════════════════════════════
# JWT — Usa la misma clave del ERP
# ══════════════════════════════════════════════════════════
esquema_seguridad = HTTPBearer()

def verificar_token(credenciales: HTTPAuthorizationCredentials = Depends(esquema_seguridad)):
    token = credenciales.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario = payload.get("sub")
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")


def _resolver_id_personal(payload):
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


# ══════════════════════════════════════════════════════════
# SOCKET.IO — Servidor de tiempo real
# ══════════════════════════════════════════════════════════
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    ping_interval=25,
    ping_timeout=60,
    logger=True,
    engineio_logger=True,
)

# Mapa de usuarios conectados: id_personal → set(sid)
usuarios_conectados = {}


@sio.event
async def connect(sid, environ, auth):
    """
    Autenticar al conectarse.
    socket.io-client v4 envía auth como tercer parámetro.
    Fallback: query string ?token=...
    """
    token = None

    # 1. auth dict (socket.io-client v4+)
    if auth and isinstance(auth, dict):
        token = auth.get('token')

    # 2. Fallback: query string
    if not token:
        qs = environ.get('QUERY_STRING', '')
        for part in qs.split('&'):
            if part.startswith('token='):
                token = part.split('=', 1)[1]
                break

    if not token:
        logger.warning(f"[Chat] Conexión rechazada sid={sid}: sin token")
        raise socketio.exceptions.ConnectionRefusedError('Token requerido')

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        logger.warning(f"[Chat] Token inválido sid={sid}: {e}")
        raise socketio.exceptions.ConnectionRefusedError('Token inválido')

    id_personal, nombre = _resolver_id_personal(payload)
    if not id_personal:
        logger.warning(f"[Chat] Sin id_personal sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError('Usuario no encontrado')

    # Registrar conexión
    await sio.save_session(sid, {
        'id_personal': id_personal,
        'id_accs': payload.get('id_accs'),
        'nombre': nombre,
    })

    if id_personal not in usuarios_conectados:
        usuarios_conectados[id_personal] = set()
    usuarios_conectados[id_personal].add(sid)

    logger.info(f"[Chat] + Conectado: {nombre} (id={id_personal}, sid={sid}) | Total: {len(usuarios_conectados)}")

    # Notificar a todos que este usuario está en línea
    await sio.emit('usuario_conectado', {'id_personal': id_personal})


@sio.event
async def disconnect(sid):
    """Limpiar conexión al desconectarse."""
    session = await sio.get_session(sid)
    if not session:
        return
    id_personal = session.get('id_personal')
    nombre = session.get('nombre', '?')
    if id_personal and id_personal in usuarios_conectados:
        usuarios_conectados[id_personal].discard(sid)
        if not usuarios_conectados[id_personal]:
            del usuarios_conectados[id_personal]
            await sio.emit('usuario_desconectado', {'id_personal': id_personal})
            logger.info(f"[Chat] - Desconectado: {nombre} (id={id_personal}) | Total: {len(usuarios_conectados)}")


@sio.event
async def enviar_mensaje(sid, data):
    """
    Recibe: { destinatario_id, contenido }
    Guarda en MongoDB y reenvía al destinatario.
    Retorna ack al remitente.
    """
    session = await sio.get_session(sid)
    if not session:
        return {'error': 'No autenticado'}

    remitente_id = session['id_personal']
    nombre_remitente = session.get('nombre', 'Usuario')
    destinatario_id = data.get('destinatario_id')
    contenido = (data.get('contenido') or '').strip()

    if not destinatario_id or not contenido:
        return {'error': 'Datos incompletos'}

    # Asegurar int
    try:
        destinatario_id = int(destinatario_id)
    except (ValueError, TypeError):
        return {'error': 'destinatario_id inválido'}

    ahora = datetime.now()

    # Guardar en MongoDB
    mensaje_doc = {
        'remitente_id': remitente_id,
        'destinatario_id': destinatario_id,
        'contenido': contenido,
        'nombre_remitente': nombre_remitente,
        'fecha': ahora,
        'leido': False,
    }

    try:
        resultado = await coleccion_mensajes.insert_one(mensaje_doc)
        mensaje_id = str(resultado.inserted_id)
    except Exception as e:
        logger.error(f"[Chat] Error MongoDB: {e}")
        return {'error': 'Error guardando mensaje'}

    # Objeto para emitir a ambos
    msg_emit = {
        'id': mensaje_id,
        'remitente_id': remitente_id,
        'destinatario_id': destinatario_id,
        'contenido': contenido,
        'nombre_remitente': nombre_remitente,
        'fecha': ahora.isoformat(),
    }

    # Enviar al destinatario
    sids_destino = list(usuarios_conectados.get(destinatario_id, []))
    for rsid in sids_destino:
        await sio.emit('mensaje_nuevo', msg_emit, to=rsid)

    logger.info(f"[Chat] Msg {nombre_remitente} -> {destinatario_id}: {contenido[:40]}")

    # Ack al remitente (callback del emit en el cliente)
    return {'ok': True, 'mensaje': msg_emit}


@sio.event
async def escribiendo(sid, data):
    """Notifica al otro usuario que estoy escribiendo."""
    session = await sio.get_session(sid)
    if not session:
        return
    remitente_id = session['id_personal']
    destinatario_id = data.get('destinatario_id')
    if not destinatario_id:
        return
    try:
        destinatario_id = int(destinatario_id)
    except (ValueError, TypeError):
        return
    sids_destino = list(usuarios_conectados.get(destinatario_id, []))
    for rsid in sids_destino:
        await sio.emit('escribiendo', {'remitente_id': remitente_id}, to=rsid)


# ══════════════════════════════════════════════════════════
# FASTAPI — Endpoints REST
# ══════════════════════════════════════════════════════════
fastapi_app = FastAPI(title="ERP Chat Server", docs_url="/docs")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/ping")
def ping():
    return {
        "status": "pong",
        "servicio": "chat",
        "ts": time.time(),
        "usuarios_conectados": len(usuarios_conectados),
    }


@fastapi_app.get("/contactos")
def obtener_contactos(db=Depends(get_db), token: dict = Depends(verificar_token)):
    """Retorna todos los empleados activos con estado online/offline."""
    filas = (
        db.query(Personal, Cargo)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .all()
    )

    vistos = set()
    contactos = []
    for p, c in filas:
        if p.ID_PERSONAL in vistos:
            continue
        vistos.add(p.ID_PERSONAL)
        contactos.append({
            'id_personal': p.ID_PERSONAL,
            'nombre': f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            'cargo': c.DESCRIP if c else '',
            'foto': p.FOTO,
            'en_linea': p.ID_PERSONAL in usuarios_conectados,
        })

    contactos.sort(key=lambda x: (not x['en_linea'], x['nombre']))
    return contactos


@fastapi_app.get("/conectados")
def obtener_conectados(token: dict = Depends(verificar_token)):
    """Lista de IDs de usuarios conectados."""
    return {"ids": list(usuarios_conectados.keys()), "total": len(usuarios_conectados)}


@fastapi_app.get("/mensajes/{id_otro}")
async def obtener_historial(
    id_otro: int,
    limite: int = 50,
    token: dict = Depends(verificar_token),
    db=Depends(get_db),
):
    """Historial de mensajes entre el usuario actual y otro."""
    id_personal, _ = _resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    mi_id = id_personal

    cursor = coleccion_mensajes.find({
        "$or": [
            {"remitente_id": mi_id, "destinatario_id": id_otro},
            {"remitente_id": id_otro, "destinatario_id": mi_id},
        ]
    }).sort("fecha", -1).limit(limite)

    mensajes = await cursor.to_list(length=limite)

    # Marcar como leídos
    await coleccion_mensajes.update_many(
        {"remitente_id": id_otro, "destinatario_id": mi_id, "leido": False},
        {"$set": {"leido": True}},
    )

    resultado = []
    for m in reversed(mensajes):
        resultado.append({
            'id': str(m['_id']),
            'remitente_id': m['remitente_id'],
            'destinatario_id': m['destinatario_id'],
            'contenido': m['contenido'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'leido': m.get('leido', False),
        })

    return resultado


@fastapi_app.get("/no-leidos")
async def mensajes_no_leidos(
    token: dict = Depends(verificar_token),
    db=Depends(get_db),
):
    """Mensajes no leídos agrupados por remitente."""
    id_personal, _ = _resolver_id_personal(token)
    if not id_personal:
        return {"total": 0, "por_contacto": {}}

    mi_id = id_personal

    pipeline = [
        {"$match": {"destinatario_id": mi_id, "leido": False}},
        {"$group": {"_id": "$remitente_id", "count": {"$sum": 1}}},
    ]
    cursor = coleccion_mensajes.aggregate(pipeline)
    resultados = await cursor.to_list(length=500)

    por_contacto = {}
    total = 0
    for r in resultados:
        por_contacto[r['_id']] = r['count']
        total += r['count']

    return {"total": total, "por_contacto": por_contacto}


# ══════════════════════════════════════════════════════════
# APP COMBINADA — Socket.IO envuelve FastAPI
#
# Socket.IO intercepta /socket.io/* (handshake, websocket)
# Todo lo demás (REST) pasa a FastAPI
# ══════════════════════════════════════════════════════════
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


# ══════════════════════════════════════════════════════════
# ARRANQUE
# ══════════════════════════════════════════════════════════
if __name__ == "__main__":
    uvicorn.run(
        "chat_server:app",
        host="0.0.0.0",
        port=CHAT_PORT,
        reload=True,
    )
