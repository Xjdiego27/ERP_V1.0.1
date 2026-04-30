# ============================================
# CHAT BACKEND — Servidor independiente (puerto 4001)
#
# Arquitectura modular:
#   chat_config.py          → Variables de entorno y configuración
#   chat_db.py              → Conexiones MySQL y MongoDB
#   chat_auth.py            → Autenticación JWT
#   chat_socket_events.py   → Eventos Socket.IO (connect, msg, zumbido, etc.)
#   chat_routes.py          → Endpoints REST FastAPI
#   chat_server.py          → Punto de entrada (este archivo)
#
# Socket.IO maneja /socket.io/* (WebSocket + polling)
# FastAPI maneja todo lo demás (/contactos, /mensajes, etc.)
# ============================================

import logging
import uvicorn
import socketio

from chat_config import CHAT_PORT
from chat_socket_events import sio        # Socket.IO server con todos los eventos registrados
from chat_routes import fastapi_app       # FastAPI app con todas las rutas registradas

logging.basicConfig(level=logging.INFO)


# ══════════════════════════════════════════════════════════
# MIDDLEWARE — Cache-Control: no-store para /socket.io/
# Evita ERR_CACHE_OPERATION_NOT_SUPPORTED en Chrome al intentar
# cachear respuestas de long-polling (streams no cacheables).
# ══════════════════════════════════════════════════════════
class NoCacheSocketIO:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http' and '/socket.io/' in scope.get('path', ''):
            async def send_nocache(event):
                if event['type'] == 'http.response.start':
                    headers = list(event.get('headers', []))
                    headers.append((b'cache-control', b'no-store'))
                    event = {**event, 'headers': headers}
                await send(event)
            await self.app(scope, receive, send_nocache)
        else:
            await self.app(scope, receive, send)


# ══════════════════════════════════════════════════════════
# APP COMBINADA — Socket.IO envuelve FastAPI
# ══════════════════════════════════════════════════════════
app = NoCacheSocketIO(socketio.ASGIApp(sio, other_asgi_app=fastapi_app))


# ══════════════════════════════════════════════════════════
# ARRANQUE
# ══════════════════════════════════════════════════════════
if __name__ == "__main__":
    uvicorn.run(
        "chat_server:app",
        host="0.0.0.0",
        port=CHAT_PORT,
        reload=False,
    )
