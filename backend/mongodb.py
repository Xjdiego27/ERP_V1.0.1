# ============================================
# CONEXIÓN A MONGODB — Motor async para FastAPI
# Base de datos: erp_nosql
# Colecciones: menus, eventos, cumpleanos
# ============================================

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "erp_nosql")

cliente_mongo = AsyncIOMotorClient(MONGO_URL)

# Base de datos
db_mongo = cliente_mongo[MONGO_DB_NAME]

# === COLECCIONES ===
coleccion_menus = db_mongo["menus"]                    # Registros de menú subidos
coleccion_eventos = db_mongo["eventos"]                # Registros de eventos subidos
coleccion_asistencia = db_mongo["asistencia"]          # Marcajes del huellero (ZkTimeNet → MongoDB)
coleccion_justificaciones = db_mongo["justificaciones"]  # Justificaciones manuales de asistencia
coleccion_auditoria = db_mongo["auditoria"]            # Log de cambios: quién, qué, a quién, cuándo
coleccion_notif_tickets = db_mongo["notificaciones_tickets"]  # Notificaciones de tickets (creación, estado)
