# ============================================
# RUTAS PUSH — Web Push Notifications (VAPID)
# Almacena suscripciones push por usuario y envía
# notificaciones del sistema operativo al browser.
# ============================================

import json
import os
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, Personal
from auth_token import verificar_token
from mongodb import coleccion_push_suscripciones

router = APIRouter()

# ── Configuración VAPID ──────────────────────────
VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "BP1irtdR4fFitQItazHcArSW7GSCBr2hyh99MJH7eEfJTQnck3JT0OLTLcVFYT-4_N0kZBxSTpfKfoRmspIxCAQ"
)
VAPID_PRIVATE_PEM = os.getenv(
    "VAPID_PRIVATE_PEM",
    "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDutwOdgTa4doGTFd\nC7cnNbuHs5vcUz1j4gVKyeeOumOhRANCAAT9Yq7XUeHxYrUCLWsx3AK0luxkgga9\nocoffTCR+3hHyU0J3JNyU9Di0y3FRWE/uPzdJGQcUk6Xyn6EZrKSMQgE\n-----END PRIVATE KEY-----\n"
).replace("\\n", "\n")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "contacto@intranet.local")


# ── Endpoints ────────────────────────────────────

@router.get("/push/vapid-public-key")
def obtener_vapid_public_key(_: dict = Depends(verificar_token)):
    """Devuelve la clave pública VAPID para que el browser se suscriba."""
    return {"public_key": VAPID_PUBLIC_KEY}


@router.post("/push/suscribir")
async def suscribir_push(
    datos: dict,
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token),
):
    """
    Guarda la suscripción push del browser para el usuario actual.
    Body: { endpoint, keys: { p256dh, auth } }
    """
    id_accs = token.get("id_accs")
    persona = db.query(Personal).filter(Personal.ID_ACCS == id_accs).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    endpoint = datos.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Falta endpoint")

    # Upsert: un endpoint por usuario (puede tener múltiples dispositivos)
    await coleccion_push_suscripciones.update_one(
        {"endpoint": endpoint},
        {
            "$set": {
                "id_personal": persona.ID_PERSONAL,
                "endpoint": endpoint,
                "keys": datos.get("keys", {}),
                "user_agent": datos.get("user_agent", ""),
                "actualizado": datetime.now(),
            },
            "$setOnInsert": {"creado": datetime.now()},
        },
        upsert=True,
    )
    return {"ok": True}


@router.delete("/push/desuscribir")
async def desuscribir_push(
    datos: dict,
    token: dict = Depends(verificar_token),
):
    """Elimina la suscripción push del browser actual."""
    endpoint = datos.get("endpoint")
    if endpoint:
        await coleccion_push_suscripciones.delete_one({"endpoint": endpoint})
    return {"ok": True}


# ── Helper para enviar push ───────────────────────

async def enviar_push_a_personal(
    ids_personal: list,
    titulo: str,
    cuerpo: str,
    url: str = "/",
    icono: str = "/assets/icono.jpg",
):
    """
    Envía una Web Push Notification a todos los dispositivos suscritos
    de los IDs de personal indicados.
    """
    if not ids_personal:
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return  # Si no está instalado, ignorar silenciosamente

    payload = json.dumps({
        "title": titulo,
        "body": cuerpo,
        "icon": icono,
        "badge": icono,
        "url": url,
        "timestamp": int(datetime.now().timestamp() * 1000),
    })

    cursor = coleccion_push_suscripciones.find(
        {"id_personal": {"$in": list(ids_personal)}}
    )
    suscripciones = await cursor.to_list(length=500)

    errores_endpoint = []

    for sub in suscripciones:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": sub.get("keys", {}),
        }
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda s=subscription_info: webpush(
                    subscription_info=s,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_PEM,
                    vapid_claims={
                        "sub": f"mailto:{VAPID_EMAIL}",
                    },
                    content_encoding="aes128gcm",
                ),
            )
        except Exception as exc:
            msg = str(exc)
            # Si la suscripción expiró/fue eliminada, limpiarla
            if "410" in msg or "404" in msg or "unsubscribed" in msg.lower():
                errores_endpoint.append(sub["endpoint"])

    # Limpiar suscripciones caducadas
    if errores_endpoint:
        await coleccion_push_suscripciones.delete_many(
            {"endpoint": {"$in": errores_endpoint}}
        )
