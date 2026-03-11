# auditoria.py
# Helper para registrar acciones en la colección 'auditoria' de MongoDB.
# Cada registro guarda: quién hizo el cambio, qué acción, a quién afectó, y los datos.

from datetime import datetime
from mongodb import coleccion_auditoria


async def registrar_accion(usuario, accion, modulo, id_afectado=None, nombre_afectado="", datos_nuevos=None, datos_anteriores=None):
    """
    Registra una acción en el log de auditoría.

    Parámetros:
        usuario         — usuario que realizó la acción (str, ej: 'JVILLEGAS')
        accion          — tipo de acción (str, ej: 'JUSTIFICAR', 'CREAR', 'EDITAR', 'ELIMINAR')
        modulo          — módulo afectado (str, ej: 'ASISTENCIA', 'PERSONAL', 'DOCUMENTOS')
        id_afectado     — ID del registro afectado (int o str, ej: id_personal)
        nombre_afectado — nombre legible del afectado (str, ej: 'LOPEZ GARCIA, JUAN')
        datos_nuevos    — dict con los datos nuevos/cambiados
        datos_anteriores— dict con los datos previos al cambio (opcional)
    """
    doc = {
        "usuario": usuario,
        "accion": accion,
        "modulo": modulo,
        "id_afectado": id_afectado,
        "nombre_afectado": nombre_afectado,
        "datos_nuevos": datos_nuevos or {},
        "datos_anteriores": datos_anteriores or {},
        "fecha": datetime.now().isoformat(),
    }
    await coleccion_auditoria.insert_one(doc)
