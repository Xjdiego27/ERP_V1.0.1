import time
from pymongo import MongoClient, UpdateOne
from datetime import datetime
import os
import sys
from dotenv import load_dotenv
from zk import ZK

# --- CONFIGURACIÓN ---
DIRECTORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(DIRECTORIO_SCRIPT, '.env'))

HUELLERO_IP = os.getenv("HUELLERO_IP", "192.168.1.254") 
HUELLERO_PORT = int(os.getenv("HUELLERO_PORT", 4370)) # Puerto estándar es 4370

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGO_DB_NAME", "erp_nosql")
COLECCION_NAME = os.getenv("MONGO_COLECCION", "asistencia")

RANGOS_OPERATIVOS = [
    ("00:00", "23:59") # Temporalmente todo el día para pruebas
]

def esta_en_horario_permitido():
    hora_actual = datetime.now().strftime("%H:%M")
    for inicio, fin in RANGOS_OPERATIVOS:
        if inicio <= hora_actual <= fin:
            return True
    return False

def ejecutar_sincronizacion():
    # force_udp=True suele arreglar el WinError 6 en Windows
    zk = ZK(HUELLERO_IP, port=HUELLERO_PORT, timeout=10, force_udp=True)
    conn = None
    cliente_mongo = None
    
    try:
        print(f"[{datetime.now()}] Intentando conectar al huellero {HUELLERO_IP}...")
        conn = zk.connect()
        
        # Desactivar el sonido del reloj para confirmar conexión (opcional)
        conn.disable_device() 
        asistencias = conn.get_attendance()
        
        cliente_mongo = MongoClient(MONGO_URI)
        db = cliente_mongo[DB_NAME]
        coleccion = db[COLECCION_NAME]
        
        operaciones = []
        for x in asistencias:
            fecha_dt = x.timestamp
            if fecha_dt.year == datetime.now().year:
                documento = {
                    "emp_pin": x.user_id,
                    "fecha_hora": fecha_dt,
                    "dia": fecha_dt.strftime("%Y-%m-%d"),
                    "hora": fecha_dt.strftime("%H:%M:%S"),
                    "tipo_origen": "Reloj_Directo_IP"
                }
                operaciones.append(
                    UpdateOne(
                        {"emp_pin": x.user_id, "fecha_hora": fecha_dt}, 
                        {"$set": documento}, 
                        upsert=True
                    )
                )

        if operaciones:
            coleccion.create_index([("emp_pin", 1), ("fecha_hora", -1)])
            resultado = coleccion.bulk_write(operaciones)
            print(f"Sincronizado: {resultado.upserted_count} nuevos, {resultado.modified_count} actualizados.")
        else:
            print("No se encontraron registros en el reloj.")
            
        conn.enable_device() # Volver a activar el reloj
        
    except Exception as e:
        print(f"Error en la conexión/sincronización: {e}")
    finally:
        if conn:
            try:
                conn.disconnect()
            except:
                pass
        if cliente_mongo:
            cliente_mongo.close()

if __name__ == '__main__':
    print("Servicio de Asistencias iniciado (Directo a MongoDB)...")
    while True:
        if esta_en_horario_permitido():
            ejecutar_sincronizacion()
        else:
            print(f"[{datetime.now().strftime('%H:%M')}] Fuera de horario.")
        
        # Esperar 5 minutos
        time.sleep(300)