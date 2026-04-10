import time
from pymongo import MongoClient, UpdateOne
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv
from zk import ZK

# --- CONFIGURACION ---
DIRECTORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(DIRECTORIO_SCRIPT, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

HUELLERO_IP = os.getenv('HUELLERO_IP', '192.168.1.254')
HUELLERO_PORT = int(os.getenv('HUELLERO_PORT', 4370))

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('MONGO_DB_NAME', 'erp_nosql')
COLECCION_NAME = os.getenv('MONGO_COLECCION', 'asistencia')

RANGOS_OPERATIVOS = [
    ('00:00', '23:59')
]


def log(msg):
    print(f'[{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] {msg}', flush=True)


def esta_en_horario_permitido():
    hora_actual = datetime.now().strftime('%H:%M')
    for inicio, fin in RANGOS_OPERATIVOS:
        if inicio <= hora_actual <= fin:
            return True
    return False


def obtener_ultima_marca(coleccion):
    """Busca la marca mas reciente en Mongo. Retorna None si no hay nada (primera vez)."""
    ultimo = coleccion.find_one(
        {'tipo_origen': 'Reloj_Directo_IP'},
        sort=[('fecha_hora', -1)],
        projection={'fecha_hora': 1}
    )
    return ultimo['fecha_hora'] if ultimo else None


def ejecutar_sincronizacion():
    zk = ZK(HUELLERO_IP, port=HUELLERO_PORT, timeout=10, force_udp=True)
    conn = None
    cliente_mongo = None

    try:
        log(f'Conectando al huellero {HUELLERO_IP}...')
        conn = zk.connect()
        conn.disable_device()
        asistencias = conn.get_attendance()

        if not asistencias:
            log('El huellero no devolvio registros.')
            conn.enable_device()
            return

        # --- DIAGNOSTICO: rango de fechas del dispositivo ---
        fechas = [x.timestamp for x in asistencias]
        fecha_min = min(fechas)
        fecha_max = max(fechas)
        log(f'Huellero: {len(asistencias)} registros | '
            f'Rango: {fecha_min.strftime("%Y-%m-%d")} -> {fecha_max.strftime("%Y-%m-%d")}')

        # --- CONECTAR A MONGO ---
        cliente_mongo = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = cliente_mongo[DB_NAME]
        coleccion = db[COLECCION_NAME]

        # --- DETERMINAR MODO: primera vez (TODO) o incremental (solo nuevo) ---
        ultima_marca = obtener_ultima_marca(coleccion)

        if ultima_marca is None:
            # ===== PRIMERA VEZ: jalar TODA la data del huellero =====
            log('PRIMERA SINCRONIZACION: importando TODOS los registros del huellero...')
            asistencias_a_procesar = asistencias
            marcas_existentes = set()
        else:
            # ===== INCREMENTAL: solo marcas nuevas desde la ultima registrada =====
            # Margen de 1 minuto para no perder marcas por diferencia de segundos
            desde = ultima_marca - timedelta(minutes=1)
            asistencias_a_procesar = [x for x in asistencias if x.timestamp >= desde]
            log(f'Incremental: ultima marca en Mongo = {ultima_marca.strftime("%Y-%m-%d %H:%M:%S")} | '
                f'{len(asistencias_a_procesar)} candidatas del huellero')

            # Cargar solo firmas recientes para comparar (rapido)
            marcas_existentes = set()
            for m in coleccion.find(
                {'fecha_hora': {'$gte': desde}},
                {'emp_pin': 1, 'fecha_hora': 1}
            ):
                firma = (m['emp_pin'], m['fecha_hora'].replace(second=0, microsecond=0))
                marcas_existentes.add(firma)
            log(f'Firmas recientes en Mongo: {len(marcas_existentes)}')

        if not asistencias_a_procesar:
            log('Sin marcas nuevas que procesar.')
            conn.enable_device()
            return

        # --- CONSTRUIR OPERACIONES solo para marcas nuevas ---
        operaciones = []
        for x in asistencias_a_procesar:
            firma_actual = (x.user_id, x.timestamp.replace(second=0, microsecond=0))

            if firma_actual in marcas_existentes:
                continue

            operaciones.append(
                UpdateOne(
                    {'emp_pin': x.user_id, 'fecha_hora': x.timestamp},
                    {'$set': {
                        'emp_pin': x.user_id,
                        'fecha_hora': x.timestamp,
                        'dia': x.timestamp.strftime('%Y-%m-%d'),
                        'hora': x.timestamp.strftime('%H:%M:%S'),
                        'tipo_origen': 'Reloj_Directo_IP'
                    }},
                    upsert=True
                )
            )
            marcas_existentes.add(firma_actual)

        if operaciones:
            # Bulk write en lotes de 1000 para no saturar
            total_nuevas = 0
            for i in range(0, len(operaciones), 1000):
                lote = operaciones[i:i + 1000]
                resultado = coleccion.bulk_write(lote)
                total_nuevas += resultado.upserted_count
            log(f'EXITO: {total_nuevas} marcas nuevas de {len(operaciones)} procesadas.')
        else:
            log('Sin novedades, todo sincronizado.')

        conn.enable_device()

    except Exception as e:
        log(f'ERROR: {e}')
    finally:
        if conn:
            try:
                conn.disconnect()
            except Exception:
                pass
        if cliente_mongo:
            cliente_mongo.close()


if __name__ == '__main__':
    log('Servicio de Asistencias iniciado (Directo a MongoDB)...')

    # Crear indice una sola vez al arrancar
    try:
        c = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        c[DB_NAME][COLECCION_NAME].create_index([('emp_pin', 1), ('fecha_hora', -1)])
        log('Indice emp_pin/fecha_hora verificado.')
        c.close()
    except Exception as e:
        log(f'Advertencia al crear indice: {e}')

    while True:
        if esta_en_horario_permitido():
            ejecutar_sincronizacion()
        else:
            log('Fuera de horario operativo.')
        time.sleep(60)
