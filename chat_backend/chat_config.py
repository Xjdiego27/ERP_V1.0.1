# ============================================
# chat_config.py — Configuración del servidor de chat
# ============================================
import os
from dotenv import load_dotenv

# En Docker las variables vienen del environment del compose.
# En desarrollo local, intentar cargar .env como fallback.
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # Fallback: intentar el .env del backend (solo en desarrollo local)
    env_backend = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    if os.path.exists(env_backend):
        load_dotenv(env_backend)

# ── MySQL ──
DB_HOST     = os.getenv('DB_HOST', 'localhost')
DB_USER     = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME     = os.getenv('DB_NAME', 'erp')
DB_PORT     = os.getenv('DB_PORT', '3306')

# ── JWT ──
SECRET_KEY  = os.getenv('SECRET_KEY')
ALGORITHM   = os.getenv('ALGORITHM', 'HS256')

# ── MongoDB ──
MONGO_URL     = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'erp_nosql')

# ── Server ──
CHAT_PORT = int(os.getenv('CHAT_PORT', '8001'))

# ── CORS ──
_cors_env = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
CORS_ORIGINS = [o.strip() for o in _cors_env if o.strip()]
CORS_ORIGIN_REGEX = r'https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?'

# ── Upload ──
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_UPLOAD_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
