# ============================================
# CREAR ÍNDICES en MongoDB — Ejecutar UNA vez
# Optimiza las queries más frecuentes del ERP
#
# Uso:  python crear_indices_mongo.py
# ============================================

import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "erp_nosql")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]

print(f"Conectando a {MONGO_URL} → BD: {MONGO_DB_NAME}")
print("=" * 60)


def crear(col_nombre, nombre_idx, campos, **kwargs):
    """Crea un índice si no existe."""
    col = db[col_nombre]
    existentes = col.index_information()
    if nombre_idx in existentes:
        print(f"  ⏭  {col_nombre}.{nombre_idx} ya existe")
        return
    col.create_index(campos, name=nombre_idx, **kwargs)
    print(f"  ✅ {col_nombre}.{nombre_idx} creado")


# ── 1. notificaciones_tickets ──────────────────
# Query más pesada: find({id_personal, leido:false, fecha >= X}).sort(fecha, -1).limit(20)
# También: delete_many({id_ticket, id_personal, leido:false})
# También: find_one({id_personal, tipo, leido:false})
print("\n📌 notificaciones_tickets")
crear("notificaciones_tickets", "idx_personal_leido_fecha",
      [("id_personal", ASCENDING), ("leido", ASCENDING), ("fecha", DESCENDING)])
crear("notificaciones_tickets", "idx_ticket_personal_leido",
      [("id_ticket", ASCENDING), ("id_personal", ASCENDING), ("leido", ASCENDING)])

# ── 2. menus ───────────────────────────────────
# Query: find_one({fecha_subida >= hoy, <= fin_hoy}).sort(fecha_subida, -1)
print("\n📌 menus")
crear("menus", "idx_fecha_subida",
      [("fecha_subida", DESCENDING)])

# ── 3. eventos ─────────────────────────────────
# Query: find({fecha_subida >= hoy}).sort(fecha_subida, -1)
print("\n📌 eventos")
crear("eventos", "idx_fecha_subida",
      [("fecha_subida", DESCENDING)])

# ── 4. asistencia ──────────────────────────────
# Query: distinct("emp_pin", {dia: "2026-03-18"})
# Query: find({emp_pin, dia >= X, dia <= Y})
print("\n📌 asistencia")
crear("asistencia", "idx_dia_emppin",
      [("dia", ASCENDING), ("emp_pin", ASCENDING)])
crear("asistencia", "idx_emppin_dia",
      [("emp_pin", ASCENDING), ("dia", ASCENDING)])

# ── 5. justificaciones ────────────────────────
# Query: find({fecha: "2026-03-18"}, {id_personal: 1})
print("\n📌 justificaciones")
crear("justificaciones", "idx_fecha",
      [("fecha", ASCENDING)])

# ── 6. saludos_cumpleanos ─────────────────────
# Query: find_one({id_personal_cumple, anio})
print("\n📌 saludos_cumpleanos")
crear("saludos_cumpleanos", "idx_personal_anio",
      [("id_personal_cumple", ASCENDING), ("anio", ASCENDING)])

# ── 7. chat_mensajes (chat_backend) ──────────
# Colección del chat server — si existe aquí
print("\n📌 chat_mensajes")
crear("chat_mensajes", "idx_par_fecha",
      [("par", ASCENDING), ("fecha", DESCENDING)])

# ── 8. chat_general ───────────────────────────
print("\n📌 chat_general")
crear("chat_general", "idx_fecha",
      [("fecha", DESCENDING)])

# ── 9. chat_notas_personales ──────────────────
print("\n📌 chat_notas_personales")
crear("chat_notas_personales", "idx_personal_fecha",
      [("id_personal", ASCENDING), ("fecha", DESCENDING)])

# ── 10. auditoria ─────────────────────────────
print("\n📌 auditoria")
crear("auditoria", "idx_fecha",
      [("fecha", DESCENDING)])
crear("auditoria", "idx_modulo_fecha",
      [("modulo", ASCENDING), ("fecha", DESCENDING)])


print("\n" + "=" * 60)
print("✅ Todos los índices verificados/creados exitosamente")
print("=" * 60)

client.close()
