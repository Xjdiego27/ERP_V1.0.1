# ============================================
# chat_config.py — Configuración del servidor de chat
# ============================================
import os
from dotenv import load_dotenv

# Cargar variables desde el .env del backend
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

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
CHAT_PORT = int(os.getenv('CHAT_PORT', '4001'))

# ── AES ──
AES_KEY = os.getenv('AES_KEY', '')

# ── Push / VAPID ──
VAPID_PUBLIC_KEY = os.getenv(
    'VAPID_PUBLIC_KEY',
    'BP1irtdR4fFitQItazHcArSW7GSCBr2hyh99MJH7eEfJTQnck3JT0OLTLcVFYT-4_N0kZBxSTpfKfoRmspIxCAQ'
)
VAPID_PRIVATE_PEM = os.getenv(
    'VAPID_PRIVATE_PEM',
    '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDutwOdgTa4doGTFd\nC7cnNbuHs5vcUz1j4gVKyeeOumOhRANCAAT9Yq7XUeHxYrUCLWsx3AK0luxkgga9\nocoffTCR+3hHyU0J3JNyU9Di0y3FRWE/uPzdJGQcUk6Xyn6EZrKSMQgE\n-----END PRIVATE KEY-----\n'
).replace('\\n', '\n')
VAPID_EMAIL = os.getenv('VAPID_EMAIL', 'contacto@intranet.local')

# ── CORS ──
_cors_env = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS_ORIGINS = [o.strip() for o in _cors_env if o.strip()]
CORS_ORIGIN_REGEX = r'https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?'

# ── Upload ──
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_UPLOAD_TYPES = {
    # Imágenes
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml',
    # Documentos
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    # Comprimidos
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar',
    'application/x-7z-compressed',
}
