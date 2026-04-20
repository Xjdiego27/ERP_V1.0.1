# ============================================
# chat_socket_events.py — Eventos Socket.IO
# ============================================
import asyncio
import logging
from datetime import datetime
from bson import ObjectId
from jose import jwt, JWTError
import socketio

from chat_config import SECRET_KEY, ALGORITHM, CORS_ORIGINS
from chat_auth import resolver_id_personal
from chat_db import coleccion_mensajes, coleccion_msg_general, coleccion_msg_grupo, coleccion_grupos
from chat_push import enviar_push_chat, ids_suscritos_push

logger = logging.getLogger("chat")

# ── Socket.IO server ──
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        'http://localhost:3000',
        'http://localhost:5173',
        'http://intraneteq',
        'http://intraneteq:3000',
    ],
    ping_interval=25,
    ping_timeout=60,
    logger=False,
    engineio_logger=False,
)

# Mapa de usuarios conectados: id_personal → set(sid)
usuarios_conectados = {}
_lock_usuarios = asyncio.Lock()

SALA_GENERAL = 'sala_general'


def _texto_push_chat(data, contenido):
    tipo = data.get('tipo', 'texto') if isinstance(data, dict) else 'texto'
    if tipo == 'archivo':
        nombre = (data.get('archivo_nombre') or '').strip() if isinstance(data, dict) else ''
        return f"Archivo: {nombre}" if nombre else 'Te enviaron un archivo'
    return (contenido or '').strip() or 'Nuevo mensaje'


# ══════════════════════════════════════════════════════════
# CONEXIÓN / DESCONEXIÓN
# ══════════════════════════════════════════════════════════
@sio.event
async def connect(sid, environ, auth):
    """Autenticar al conectarse."""
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get('token')
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

    id_personal, nombre = resolver_id_personal(payload)
    if not id_personal:
        logger.warning(f"[Chat] Sin id_personal sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError('Usuario no encontrado')

    await sio.save_session(sid, {
        'id_personal': id_personal,
        'id_accs': payload.get('id_accs'),
        'nombre': nombre,
    })

    async with _lock_usuarios:
        if id_personal not in usuarios_conectados:
            usuarios_conectados[id_personal] = set()
        usuarios_conectados[id_personal].add(sid)

    # ── Auto-join sala general (TODOS reciben mensajes sin abrir ventana) ──
    await sio.enter_room(sid, SALA_GENERAL)

    # ── Auto-join todos los grupos del usuario ──
    try:
        cursor = coleccion_grupos.find(
            {'miembros': id_personal},
            {'_id': 1}
        )
        async for grupo in cursor:
            await sio.enter_room(sid, f'grupo_{str(grupo["_id"])}')
    except Exception as e:
        logger.warning(f"[Chat] Error al unir a grupos: {e}")

    logger.info(f"[Chat] + Conectado: {nombre} (id={id_personal}, sid={sid}) | Total: {len(usuarios_conectados)}")
    await sio.emit('usuario_conectado', {'id_personal': id_personal})
    await sio.emit('lista_conectados', {'ids': list(usuarios_conectados.keys())}, to=sid)


@sio.event
async def disconnect(sid):
    """Limpiar conexión al desconectarse."""
    session = await sio.get_session(sid)
    if not session:
        return
    id_personal = session.get('id_personal')
    nombre = session.get('nombre', '?')
    if id_personal and id_personal in usuarios_conectados:
        async with _lock_usuarios:
            if id_personal in usuarios_conectados:
                usuarios_conectados[id_personal].discard(sid)
                if not usuarios_conectados[id_personal]:
                    del usuarios_conectados[id_personal]
                    await sio.emit('usuario_desconectado', {'id_personal': id_personal})
                    logger.info(f"[Chat] - Desconectado: {nombre} (id={id_personal}) | Total: {len(usuarios_conectados)}")


# ══════════════════════════════════════════════════════════
# MENSAJES INDIVIDUALES
# ══════════════════════════════════════════════════════════
@sio.event
async def enviar_mensaje(sid, data):
    """Recibe: { destinatario_id, contenido }. Guarda en MongoDB y reenvía."""
    session = await sio.get_session(sid)
    if not session:
        return {'error': 'No autenticado'}

    remitente_id = session['id_personal']
    nombre_remitente = session.get('nombre', 'Usuario')
    destinatario_id = data.get('destinatario_id')
    contenido = (data.get('contenido') or '').strip()

    if not destinatario_id or not contenido:
        return {'error': 'Datos incompletos'}

    try:
        destinatario_id = int(destinatario_id)
    except (ValueError, TypeError):
        return {'error': 'destinatario_id inválido'}

    ahora = datetime.now()
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

    msg_emit = {
        'id': mensaje_id,
        'remitente_id': remitente_id,
        'destinatario_id': destinatario_id,
        'contenido': contenido,
        'nombre_remitente': nombre_remitente,
        'fecha': ahora.isoformat(),
        'leido': False,
        'tipo': mensaje_doc['tipo'],
        'archivo_url': mensaje_doc['archivo_url'],
        'archivo_nombre': mensaje_doc['archivo_nombre'],
    }

    sids_destino = list(usuarios_conectados.get(destinatario_id, []))
    for rsid in sids_destino:
        await sio.emit('mensaje_nuevo', msg_emit, to=rsid)

    if destinatario_id not in usuarios_conectados:
        await enviar_push_chat(
            [destinatario_id],
            titulo=f"Nuevo mensaje de {nombre_remitente}",
            cuerpo=_texto_push_chat(data, contenido),
            url='/dashboard',
            tag=f'chat-directo-{destinatario_id}',
        )

    logger.info(f"[Chat] Msg {nombre_remitente} -> {destinatario_id}: {contenido[:40]}")
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
    """Envía un zumbido (nudge) al destinatario."""
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
    if destinatario_id not in usuarios_conectados:
        await enviar_push_chat(
            [destinatario_id],
            titulo=f"Zumbido de {nombre_remitente}",
            cuerpo='Te enviaron un zumbido en el chat',
            url='/dashboard',
            tag=f'chat-zumbido-{destinatario_id}',
        )
    logger.info(f"[Chat] Zumbido {nombre_remitente} -> {destinatario_id}")


# ══════════════════════════════════════════════════════════
# CHAT GENERAL & GRUPOS — Socket events
# ══════════════════════════════════════════════════════════
@sio.event
async def join_general(sid, data=None):
    """Unir al usuario a la sala general."""
    await sio.enter_room(sid, SALA_GENERAL)


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
        'tipo': data.get('tipo', 'texto'),
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

    ids_push = await ids_suscritos_push(excluir_id=remitente_id)
    ids_offline = [pid for pid in ids_push if pid not in usuarios_conectados]
    if ids_offline:
        await enviar_push_chat(
            ids_offline,
            titulo='Nuevo mensaje en Chat General',
            cuerpo=f"{nombre}: {_texto_push_chat(data, contenido)}",
            url='/dashboard',
            tag='chat-general',
        )
    return {'ok': True, 'mensaje': msg_emit}


@sio.event
async def join_grupo(sid, data):
    """Unir al usuario a una sala de grupo."""
    grupo_id = data.get('grupo_id')
    if grupo_id:
        await sio.enter_room(sid, f'grupo_{grupo_id}')


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
        'leido_por': [],
    }
    resultado = await coleccion_msg_grupo.insert_one(doc)

    grupo_doc = await coleccion_grupos.find_one({'_id': grupo_id})
    if not grupo_doc:
        try:
            grupo_doc = await coleccion_grupos.find_one({'_id': ObjectId(grupo_id)})
        except Exception:
            grupo_doc = None
    grupo_nombre = (grupo_doc or {}).get('nombre', 'Grupo')
    miembros = (grupo_doc or {}).get('miembros', [])

    msg_emit = {
        'id': str(resultado.inserted_id),
        'grupo_id': grupo_id,
        'grupo_nombre': grupo_nombre,
        'remitente_id': remitente_id,
        'nombre_remitente': nombre,
        'contenido': contenido,
        'fecha': ahora.isoformat(),
        'tipo': doc['tipo'],
        'archivo_url': doc['archivo_url'],
        'archivo_nombre': doc['archivo_nombre'],
        'leido_por': [],
    }
    await sio.emit('msg_grupo', msg_emit, room=f'grupo_{grupo_id}', skip_sid=sid)

    ids_offline = []
    for miembro_id in miembros:
        try:
            miembro_id = int(miembro_id)
        except (TypeError, ValueError):
            continue
        if miembro_id == remitente_id or miembro_id in usuarios_conectados:
            continue
        ids_offline.append(miembro_id)
    if ids_offline:
        await enviar_push_chat(
            ids_offline,
            titulo=f"Nuevo mensaje en {grupo_nombre}",
            cuerpo=f"{nombre}: {_texto_push_chat(data, contenido)}",
            url='/dashboard',
            tag=f'chat-grupo-{grupo_id}',
        )
    return {'ok': True, 'mensaje': msg_emit}


# ══════════════════════════════════════════════════════════
# VISTO / READ RECEIPTS
# ══════════════════════════════════════════════════════════
@sio.event
async def marcar_visto(sid, data):
    """Marca mensajes individuales como leidos y notifica al remitente."""
    session = await sio.get_session(sid)
    if not session:
        return
    mi_id = session['id_personal']
    otro_id = data.get('contacto_id')
    if not otro_id:
        return
    try:
        otro_id = int(otro_id)
    except (ValueError, TypeError):
        return

    result = await coleccion_mensajes.update_many(
        {"remitente_id": otro_id, "destinatario_id": mi_id, "leido": False},
        {"$set": {"leido": True}},
    )

    # Siempre notificar al remitente (el REST pudo haberlos marcado antes)
    sids_otro = list(usuarios_conectados.get(otro_id, []))
    for rsid in sids_otro:
        await sio.emit('mensaje_visto', {
            'lector_id': mi_id,
            'contacto_id': otro_id,
        }, to=rsid)


@sio.event
async def marcar_visto_grupo(sid, data):
    """Marca mensajes de grupo como leidos por este usuario."""
    session = await sio.get_session(sid)
    if not session:
        return
    mi_id = session['id_personal']
    mi_nombre = session.get('nombre', 'Usuario')
    grupo_id = data.get('grupo_id')
    if not grupo_id:
        return

    ahora = datetime.now()
    result = await coleccion_msg_grupo.update_many(
        {
            "grupo_id": grupo_id,
            "remitente_id": {"$ne": mi_id},
            "leido_por.id_personal": {"$ne": mi_id},
        },
        {
            "$push": {
                "leido_por": {
                    "id_personal": mi_id,
                    "nombre": mi_nombre,
                    "fecha": ahora,
                }
            }
        },
    )

    if result.modified_count > 0:
        await sio.emit('msg_grupo_visto', {
            'grupo_id': grupo_id,
            'lector_id': mi_id,
            'lector_nombre': mi_nombre.split(' ')[0],
        }, room=f'grupo_{grupo_id}', skip_sid=sid)
