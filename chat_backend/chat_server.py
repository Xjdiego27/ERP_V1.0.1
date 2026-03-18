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
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import jwt, JWTError
import socketio
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

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
    logger=False,
    engineio_logger=False,
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
        'tipo': data.get('tipo', 'texto'),
        'archivo_url': data.get('archivo_url', ''),
        'archivo_nombre': data.get('archivo_nombre', ''),
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
        'tipo': mensaje_doc['tipo'],
        'archivo_url': mensaje_doc['archivo_url'],
        'archivo_nombre': mensaje_doc['archivo_nombre'],
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


@sio.event
async def zumbido(sid, data):
    """Envía un zumbido (nudge) al destinatario - estilo MSN Messenger."""
    session = await sio.get_session(sid)
    if not session:
        return
    remitente_id = session['id_personal']
    nombre_remitente = session.get('nombre', 'Usuario')
    destinatario_id = data.get('destinatario_id')
    if not destinatario_id:
        return
    try:
        destinatario_id = int(destinatario_id)
    except (ValueError, TypeError):
        return
    sids_destino = list(usuarios_conectados.get(destinatario_id, []))
    for rsid in sids_destino:
        await sio.emit('zumbido', {
            'remitente_id': remitente_id,
            'nombre_remitente': nombre_remitente,
        }, to=rsid)
    logger.info(f"[Chat] Zumbido {nombre_remitente} -> {destinatario_id}")


# ══════════════════════════════════════════════════════════
# CHAT GENERAL & GRUPOS
# ══════════════════════════════════════════════════════════
SALA_GENERAL = 'sala_general'

# Colecciones MongoDB adicionales
coleccion_msg_general = db_mongo["chat_general"]
coleccion_grupos = db_mongo["chat_grupos"]
coleccion_msg_grupo = db_mongo["chat_grupo_mensajes"]


@sio.event
async def join_general(sid, data=None):
    """Unir al usuario a la sala general."""
    sio.enter_room(sid, SALA_GENERAL)


@sio.event
async def msg_general(sid, data):
    """Mensaje al chat general (todos lo ven)."""
    session = await sio.get_session(sid)
    if not session:
        return {'error': 'No autenticado'}

    remitente_id = session['id_personal']
    nombre = session.get('nombre', 'Usuario')
    contenido = (data.get('contenido') or '').strip()
    if not contenido:
        return {'error': 'Vacío'}

    ahora = datetime.now()
    doc = {
        'remitente_id': remitente_id,
        'nombre_remitente': nombre,
        'contenido': contenido,
        'fecha': ahora,
        'tipo': data.get('tipo', 'texto'),         # texto | archivo
        'archivo_url': data.get('archivo_url', ''),
        'archivo_nombre': data.get('archivo_nombre', ''),
    }
    resultado = await coleccion_msg_general.insert_one(doc)

    msg_emit = {
        'id': str(resultado.inserted_id),
        'remitente_id': remitente_id,
        'nombre_remitente': nombre,
        'contenido': contenido,
        'fecha': ahora.isoformat(),
        'tipo': doc['tipo'],
        'archivo_url': doc['archivo_url'],
        'archivo_nombre': doc['archivo_nombre'],
    }
    await sio.emit('msg_general', msg_emit, room=SALA_GENERAL, skip_sid=sid)
    return {'ok': True, 'mensaje': msg_emit}


@sio.event
async def join_grupo(sid, data):
    """Unir al usuario a una sala de grupo."""
    grupo_id = data.get('grupo_id')
    if grupo_id:
        sio.enter_room(sid, f'grupo_{grupo_id}')


@sio.event
async def msg_grupo(sid, data):
    """Mensaje a un grupo específico."""
    session = await sio.get_session(sid)
    if not session:
        return {'error': 'No autenticado'}

    remitente_id = session['id_personal']
    nombre = session.get('nombre', 'Usuario')
    grupo_id = data.get('grupo_id')
    contenido = (data.get('contenido') or '').strip()
    if not grupo_id or not contenido:
        return {'error': 'Datos incompletos'}

    ahora = datetime.now()
    doc = {
        'grupo_id': grupo_id,
        'remitente_id': remitente_id,
        'nombre_remitente': nombre,
        'contenido': contenido,
        'fecha': ahora,
        'tipo': data.get('tipo', 'texto'),
        'archivo_url': data.get('archivo_url', ''),
        'archivo_nombre': data.get('archivo_nombre', ''),
    }
    resultado = await coleccion_msg_grupo.insert_one(doc)

    msg_emit = {
        'id': str(resultado.inserted_id),
        'grupo_id': grupo_id,
        'remitente_id': remitente_id,
        'nombre_remitente': nombre,
        'contenido': contenido,
        'fecha': ahora.isoformat(),
        'tipo': doc['tipo'],
        'archivo_url': doc['archivo_url'],
        'archivo_nombre': doc['archivo_nombre'],
    }
    await sio.emit('msg_grupo', msg_emit, room=f'grupo_{grupo_id}', skip_sid=sid)
    return {'ok': True, 'mensaje': msg_emit}


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
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
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
# CHAT GENERAL — REST
# ══════════════════════════════════════════════════════════
@fastapi_app.get("/mensajes/general")
async def historial_general(
    limite: int = 80,
    token: dict = Depends(verificar_token),
):
    """Historial del chat general."""
    cursor = coleccion_msg_general.find().sort("fecha", -1).limit(limite)
    docs = await cursor.to_list(length=limite)
    resultado = []
    for m in reversed(docs):
        resultado.append({
            'id': str(m['_id']),
            'remitente_id': m['remitente_id'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'contenido': m['contenido'],
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
        })
    return resultado


# ══════════════════════════════════════════════════════════
# GRUPOS — REST
# ══════════════════════════════════════════════════════════
class GrupoCrear(BaseModel):
    nombre: str
    miembros: List[int]   # IDs de personal


@fastapi_app.post("/grupos")
async def crear_grupo(
    body: GrupoCrear,
    token: dict = Depends(verificar_token),
    db=Depends(get_db),
):
    """Crear un grupo nuevo."""
    id_personal, _ = _resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    # Incluir al creador si no está
    miembros = list(set(body.miembros + [id_personal]))
    doc = {
        'nombre': body.nombre.strip(),
        'creador_id': id_personal,
        'miembros': miembros,
        'fecha_creacion': datetime.now(),
    }
    resultado = await coleccion_grupos.insert_one(doc)
    return {
        'ok': True,
        'grupo_id': str(resultado.inserted_id),
        'nombre': doc['nombre'],
        'miembros': miembros,
    }


@fastapi_app.get("/grupos")
async def listar_grupos(
    token: dict = Depends(verificar_token),
    db=Depends(get_db),
):
    """Listar grupos del usuario."""
    id_personal, _ = _resolver_id_personal(token)
    if not id_personal:
        return []

    cursor = coleccion_grupos.find({'miembros': id_personal})
    docs = await cursor.to_list(length=200)
    resultado = []
    for g in docs:
        resultado.append({
            'id': str(g['_id']),
            'nombre': g['nombre'],
            'creador_id': g['creador_id'],
            'miembros': g['miembros'],
        })
    return resultado


@fastapi_app.get("/grupos/{grupo_id}/mensajes")
async def historial_grupo(
    grupo_id: str,
    limite: int = 80,
    token: dict = Depends(verificar_token),
):
    """Historial de mensajes de un grupo."""
    cursor = coleccion_msg_grupo.find({'grupo_id': grupo_id}).sort('fecha', -1).limit(limite)
    docs = await cursor.to_list(length=limite)
    resultado = []
    for m in reversed(docs):
        resultado.append({
            'id': str(m['_id']),
            'grupo_id': m['grupo_id'],
            'remitente_id': m['remitente_id'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'contenido': m['contenido'],
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
        })
    return resultado


@fastapi_app.post("/grupos/{grupo_id}/miembros")
async def agregar_miembros(
    grupo_id: str,
    miembros: List[int],
    token: dict = Depends(verificar_token),
):
    """Agregar miembros a un grupo."""
    await coleccion_grupos.update_one(
        {'_id': ObjectId(grupo_id)},
        {'$addToSet': {'miembros': {'$each': miembros}}}
    )
    return {'ok': True}


@fastapi_app.delete("/grupos/{grupo_id}")
async def eliminar_grupo(
    grupo_id: str,
    token: dict = Depends(verificar_token),
    db=Depends(get_db),
):
    """Eliminar un grupo (solo el creador)."""
    id_personal, _ = _resolver_id_personal(token)
    grupo = await coleccion_grupos.find_one({'_id': ObjectId(grupo_id)})
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if grupo['creador_id'] != id_personal:
        raise HTTPException(status_code=403, detail="Solo el creador puede eliminar")
    await coleccion_grupos.delete_one({'_id': ObjectId(grupo_id)})
    await coleccion_msg_grupo.delete_many({'grupo_id': grupo_id})
    return {'ok': True}


# ══════════════════════════════════════════════════════════
# ARCHIVOS / UPLOAD
# ══════════════════════════════════════════════════════════
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

fastapi_app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@fastapi_app.post("/upload")
async def subir_archivo(
    file: UploadFile = File(...),
    token: dict = Depends(verificar_token),
):
    """Sube un archivo y devuelve la URL relativa."""
    ext = os.path.splitext(file.filename)[1]
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    ruta_destino = os.path.join(UPLOAD_DIR, nombre_unico)

    with open(ruta_destino, 'wb') as f:
        contenido = await file.read()
        f.write(contenido)

    url = f"/uploads/{nombre_unico}"
    return {
        'ok': True,
        'url': url,
        'nombre_original': file.filename,
        'content_type': file.content_type,
    }


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
