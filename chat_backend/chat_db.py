# ============================================
# chat_db.py — Conexiones a MySQL y MongoDB
# ============================================
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

from chat_config import DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME, MONGO_URL, MONGO_DB_NAME


# ── MySQL ──
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = automap_base()
Base.prepare(autoload_with=engine)

Personal  = Base.classes.personal
Acceso    = Base.classes.acceso
Contrato  = Base.classes.contrato
Cargo     = Base.classes.cargo
Empresa   = Base.classes.empresa if hasattr(Base.classes, 'empresa') else None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── MongoDB ──
cliente_mongo = AsyncIOMotorClient(MONGO_URL)
db_mongo = cliente_mongo[MONGO_DB_NAME]

coleccion_mensajes     = db_mongo["chat_mensajes"]
coleccion_msg_general  = db_mongo["chat_general"]
coleccion_grupos       = db_mongo["chat_grupos"]
coleccion_msg_grupo    = db_mongo["chat_grupo_mensajes"]
coleccion_notas        = db_mongo["chat_notas_personales"]
