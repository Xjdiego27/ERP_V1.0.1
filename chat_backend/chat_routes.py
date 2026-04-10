# ============================================
# chat_routes.py — Endpoints REST del chat
# ============================================
import os
import time
import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from bson import ObjectId
from bson.errors import InvalidId

from chat_config import CORS_ORIGINS, CORS_ORIGIN_REGEX, UPLOAD_DIR, MAX_UPLOAD_SIZE, ALLOWED_UPLOAD_TYPES
from chat_db import (
    get_db, Personal, Acceso, Contrato, Cargo,
    coleccion_mensajes, coleccion_msg_general,
    coleccion_grupos, coleccion_msg_grupo, coleccion_notas,
)
from chat_auth import verificar_token, resolver_id_personal
from chat_socket_events import usuarios_conectados


# ── FastAPI app ──
fastapi_app = FastAPI(title="ERP Chat Server", docs_url="/docs")


# Middleware: mide tiempo de cada request + log en consola
@fastapi_app.middleware("http")
async def timing_middleware(request, call_next):
    start = time.time()
    response = await call_next(request)
    ms = (time.time() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{ms:.2f}"
    print(f"[Chat] {request.method} {request.url.path} -- {ms:.1f} ms")
    if ms > 200:
        print(f"[WARN] [Chat] LENTO {request.method} {request.url.path} -- {ms:.1f} ms")
    return response


fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ══════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════
@fastapi_app.get("/ping")
def ping():
    return {
        "status": "pong",
        "servicio": "chat",
        "ts": time.time(),
        "usuarios_conectados": len(usuarios_conectados),
    }


# ══════════════════════════════════════════════════════════
# CONTACTOS
# ══════════════════════════════════════════════════════════
@fastapi_app.get("/contactos")
def obtener_contactos(db=Depends(get_db), token: dict = Depends(verificar_token)):
    """Retorna todos los empleados activos con estado online/offline."""
    filas = (
        db.query(Personal, Cargo)
        .join(Acceso, Acceso.ID_ACCS == Personal.ID_ACCS)
        .join(Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL)
        .join(Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO)
        .filter(
            Acceso.ID_ESTADO == 1,
            Contrato.ID_ESTADO_CONTRATO == 1,
        )
        .all()
    )

    vistos = set()
    contactos = []
    for p, c in filas:
        if p.ID_PERSONAL in vistos:
            continue
        vistos.add(p.ID_PERSONAL)
        contactos.append({
            'id_personal': p.ID_PERSONAL,
            'nombre': f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            'cargo': c.DESCRIP if c else '',
            'foto': p.FOTO,
            'en_linea': p.ID_PERSONAL in usuarios_conectados,
        })

    contactos.sort(key=lambda x: (not x['en_linea'], x['nombre']))
    return contactos


@fastapi_app.get("/conectados")
def obtener_conectados(token: dict = Depends(verificar_token)):
    """Lista de IDs de usuarios conectados."""
    return {"ids": list(usuarios_conectados.keys()), "total": len(usuarios_conectados)}


# ══════════════════════════════════════════════════════════
# CHAT GENERAL — REST (DEBE ir ANTES de /mensajes/{id_otro})
# ══════════════════════════════════════════════════════════
@fastapi_app.get("/mensajes/general")
async def historial_general(
    limite: int = 80,
    token: dict = Depends(verificar_token),
):
    """Historial del chat general."""
    cursor = coleccion_msg_general.find().sort("fecha", -1).limit(limite)
    docs = await cursor.to_list(length=limite)
    resultado = []
    for m in reversed(docs):
        resultado.append({
            'id': str(m['_id']),
            'remitente_id': m['remitente_id'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'contenido': m['contenido'],
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
        })
    return resultado


# ══════════════════════════════════════════════════════════
# MENSAJES INDIVIDUALES — REST
# ══════════════════════════════════════════════════════════
@fastapi_app.get("/mensajes/{id_otro}")
async def obtener_historial(
    id_otro: int,
    limite: int = 50,
    token: dict = Depends(verificar_token),
):
    """Historial de mensajes entre el usuario actual y otro."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    cursor = coleccion_mensajes.find({
        "$or": [
            {"remitente_id": id_personal, "destinatario_id": id_otro},
            {"remitente_id": id_otro, "destinatario_id": id_personal},
        ]
    }).sort("fecha", -1).limit(limite)

    mensajes = await cursor.to_list(length=limite)

    await coleccion_mensajes.update_many(
        {"remitente_id": id_otro, "destinatario_id": id_personal, "leido": False},
        {"$set": {"leido": True}},
    )

    resultado = []
    for m in reversed(mensajes):
        resultado.append({
            'id': str(m['_id']),
            'remitente_id': m['remitente_id'],
            'destinatario_id': m['destinatario_id'],
            'contenido': m['contenido'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'leido': m.get('leido', False),
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
        })
    return resultado


@fastapi_app.get("/no-leidos")
async def mensajes_no_leidos(token: dict = Depends(verificar_token)):
    """Mensajes no leídos agrupados por remitente."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        return {"total": 0, "por_contacto": {}}

    pipeline = [
        {"$match": {"destinatario_id": id_personal, "leido": False}},
        {"$group": {"_id": "$remitente_id", "count": {"$sum": 1}}},
    ]
    cursor = coleccion_mensajes.aggregate(pipeline)
    resultados = await cursor.to_list(length=500)

    por_contacto = {}
    total = 0
    for r in resultados:
        por_contacto[r['_id']] = r['count']
        total += r['count']

    return {"total": total, "por_contacto": por_contacto}


@fastapi_app.post("/marcar-leidos/{id_otro}")
async def marcar_leidos(id_otro: int, token: dict = Depends(verificar_token)):
    """Marcar como leídos todos los mensajes de id_otro hacia el usuario actual."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    resultado = await coleccion_mensajes.update_many(
        {"remitente_id": id_otro, "destinatario_id": id_personal, "leido": False},
        {"$set": {"leido": True}},
    )
    return {"ok": True, "marcados": resultado.modified_count}


# ══════════════════════════════════════════════════════════
# GRUPOS — REST
# ══════════════════════════════════════════════════════════
class GrupoCrear(BaseModel):
    nombre: str
    miembros: list[int]


@fastapi_app.post("/grupos")
async def crear_grupo(
    body: GrupoCrear,
    token: dict = Depends(verificar_token),
):
    """Crear un grupo nuevo."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    miembros = list(set(body.miembros + [id_personal]))
    doc = {
        'nombre': body.nombre.strip(),
        'creador_id': id_personal,
        'miembros': miembros,
        'fecha_creacion': datetime.now(),
    }
    resultado = await coleccion_grupos.insert_one(doc)
    return {
        'ok': True,
        'grupo_id': str(resultado.inserted_id),
        'nombre': doc['nombre'],
        'miembros': miembros,
    }


@fastapi_app.get("/grupos")
async def listar_grupos(token: dict = Depends(verificar_token)):
    """Listar grupos del usuario."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        return []

    cursor = coleccion_grupos.find({'miembros': id_personal})
    docs = await cursor.to_list(length=200)
    return [
        {
            'id': str(g['_id']),
            'nombre': g['nombre'],
            'creador_id': g['creador_id'],
            'miembros': g['miembros'],
        }
        for g in docs
    ]


@fastapi_app.get("/grupos/{grupo_id}/mensajes")
async def historial_grupo(
    grupo_id: str,
    limite: int = 80,
    token: dict = Depends(verificar_token),
):
    """Historial de mensajes de un grupo."""
    id_personal, _ = resolver_id_personal(token)
    cursor = coleccion_msg_grupo.find({'grupo_id': grupo_id}).sort('fecha', -1).limit(limite)
    docs = await cursor.to_list(length=limite)
    resultado = []
    for m in reversed(docs):
        leido_por_raw = m.get('leido_por', [])
        leido_por = [
            {
                'id_personal': lp['id_personal'],
                'nombre': lp.get('nombre', ''),
                'fecha': lp['fecha'].isoformat() if lp.get('fecha') else '',
            }
            for lp in leido_por_raw
        ]
        resultado.append({
            'id': str(m['_id']),
            'grupo_id': m['grupo_id'],
            'remitente_id': m['remitente_id'],
            'nombre_remitente': m.get('nombre_remitente', ''),
            'contenido': m['contenido'],
            'fecha': m['fecha'].isoformat() if m.get('fecha') else '',
            'tipo': m.get('tipo', 'texto'),
            'archivo_url': m.get('archivo_url', ''),
            'archivo_nombre': m.get('archivo_nombre', ''),
            'leido_por': leido_por,
        })

    # Marcar como leido por el usuario actual (mensajes que no son suyos)
    if id_personal:
        nombre_lector = ''
        for c in resultado:
            if c['remitente_id'] == id_personal:
                continue
            already = any(lp['id_personal'] == id_personal for lp in c['leido_por'])
            if not already:
                c['leido_por'].append({
                    'id_personal': id_personal,
                    'nombre': nombre_lector,
                    'fecha': datetime.now().isoformat(),
                })

    return resultado


@fastapi_app.post("/grupos/{grupo_id}/miembros")
async def agregar_miembros(
    grupo_id: str,
    miembros: list[int],
    token: dict = Depends(verificar_token),
):
    """Agregar miembros a un grupo."""
    try:
        oid = ObjectId(grupo_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de grupo inválido")
    await coleccion_grupos.update_one(
        {'_id': oid},
        {'$addToSet': {'miembros': {'$each': miembros}}}
    )
    return {'ok': True}


@fastapi_app.delete("/grupos/{grupo_id}")
async def eliminar_grupo(
    grupo_id: str,
    token: dict = Depends(verificar_token),
):
    """Eliminar un grupo (solo el creador)."""
    try:
        oid = ObjectId(grupo_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de grupo inválido")
    id_personal, _ = resolver_id_personal(token)
    grupo = await coleccion_grupos.find_one({'_id': oid})
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if grupo['creador_id'] != id_personal:
        raise HTTPException(status_code=403, detail="Solo el creador puede eliminar")
    await coleccion_grupos.delete_one({'_id': oid})
    await coleccion_msg_grupo.delete_many({'grupo_id': grupo_id})
    return {'ok': True}


# ══════════════════════════════════════════════════════════
# MI ESPACIO — Notas personales
# ══════════════════════════════════════════════════════════
class NotaCrear(BaseModel):
    contenido: str
    color: Optional[str] = '#fef9c3'


@fastapi_app.get("/notas")
async def listar_notas(token: dict = Depends(verificar_token)):
    """Listar notas personales del usuario."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    cursor = coleccion_notas.find({'usuario_id': id_personal}).sort('fecha', -1)
    docs = await cursor.to_list(length=200)
    return [
        {
            'id': str(n['_id']),
            'contenido': n['contenido'],
            'color': n.get('color', '#fef9c3'),
            'fecha': n['fecha'].isoformat() if n.get('fecha') else '',
            'editado': n.get('editado', False),
        }
        for n in docs
    ]


@fastapi_app.post("/notas")
async def crear_nota(
    body: NotaCrear,
    token: dict = Depends(verificar_token),
):
    """Crear una nota personal."""
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    doc = {
        'usuario_id': id_personal,
        'contenido': body.contenido.strip(),
        'color': body.color,
        'fecha': datetime.now(),
        'editado': False,
    }
    resultado = await coleccion_notas.insert_one(doc)
    return {
        'ok': True,
        'nota': {
            'id': str(resultado.inserted_id),
            'contenido': doc['contenido'],
            'color': doc['color'],
            'fecha': doc['fecha'].isoformat(),
            'editado': False,
        }
    }


@fastapi_app.put("/notas/{nota_id}")
async def editar_nota(
    nota_id: str,
    body: NotaCrear,
    token: dict = Depends(verificar_token),
):
    """Editar una nota existente."""
    try:
        oid = ObjectId(nota_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de nota inválido")
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    result = await coleccion_notas.update_one(
        {'_id': oid, 'usuario_id': id_personal},
        {'$set': {
            'contenido': body.contenido.strip(),
            'color': body.color,
            'editado': True,
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return {'ok': True}


@fastapi_app.delete("/notas/{nota_id}")
async def eliminar_nota(
    nota_id: str,
    token: dict = Depends(verificar_token),
):
    """Eliminar una nota personal."""
    try:
        oid = ObjectId(nota_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de nota inválido")
    id_personal, _ = resolver_id_personal(token)
    if not id_personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    result = await coleccion_notas.delete_one(
        {'_id': oid, 'usuario_id': id_personal}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return {'ok': True}


# ══════════════════════════════════════════════════════════
# ARCHIVOS / UPLOAD
# ══════════════════════════════════════════════════════════
@fastapi_app.post("/upload")
async def subir_archivo(
    file: UploadFile = File(...),
    token: dict = Depends(verificar_token),
):
    """Sube un archivo y devuelve la URL relativa."""
    if file.content_type and file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {file.content_type}")

    contenido = await file.read()
    if len(contenido) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande (máx {MAX_UPLOAD_SIZE // 1024 // 1024} MB)")

    ext = os.path.splitext(file.filename)[1]
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    ruta_destino = os.path.join(UPLOAD_DIR, nombre_unico)

    with open(ruta_destino, 'wb') as f:
        f.write(contenido)

    return {
        'ok': True,
        'url': f"/uploads/{nombre_unico}",
        'nombre_original': file.filename,
        'content_type': file.content_type,
    }
