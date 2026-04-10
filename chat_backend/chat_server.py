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
# APP COMBINADA — Socket.IO envuelve FastAPI
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
