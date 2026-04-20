import asyncio
import importlib
import json
from datetime import datetime

from chat_config import VAPID_PRIVATE_PEM, VAPID_EMAIL
from chat_db import coleccion_push_suscripciones


async def ids_suscritos_push(excluir_id=None):
    filtro = {}
    if excluir_id is not None:
        filtro["id_personal"] = {"$ne": excluir_id}

    ids = await coleccion_push_suscripciones.distinct("id_personal", filtro)
    resultado = []
    for item in ids:
        try:
            resultado.append(int(item))
        except (TypeError, ValueError):
            continue
    return resultado


async def enviar_push_chat(ids_personal, titulo, cuerpo, url="/dashboard", tag="chat"):
    if not ids_personal:
        return

    try:
        pywebpush = importlib.import_module("pywebpush")
        webpush = pywebpush.webpush
    except Exception:
        return

    payload = json.dumps({
        "title": titulo,
        "body": cuerpo,
        "icon": "/assets/icono.jpg",
        "badge": "/assets/icono.jpg",
        "url": url,
        "tag": tag,
        "timestamp": int(datetime.now().timestamp() * 1000),
    })

    suscripciones = await coleccion_push_suscripciones.find(
        {"id_personal": {"$in": list(ids_personal)}}
    ).to_list(length=500)

    endpoints_invalidos = []
    for sub in suscripciones:
        info = {
            "endpoint": sub.get("endpoint"),
            "keys": sub.get("keys", {}),
        }
        if not info["endpoint"]:
            continue
        try:
            await asyncio.get_running_loop().run_in_executor(
                None,
                lambda s=info: webpush(
                    subscription_info=s,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_PEM,
                    vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"},
                    content_encoding="aes128gcm",
                ),
            )
        except Exception as exc:
            texto = str(exc)
            if "410" in texto or "404" in texto or "unsubscribed" in texto.lower():
                endpoints_invalidos.append(info["endpoint"])

    if endpoints_invalidos:
        await coleccion_push_suscripciones.delete_many({
            "endpoint": {"$in": endpoints_invalidos}
        })