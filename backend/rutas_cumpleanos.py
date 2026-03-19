from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db, Personal
from auth_token import verificar_token
from helpers import empleados_activos_query

router = APIRouter()


# === CUMPLEAÑOS DEL MES (TODAS LAS EMPRESAS) ===
# Lee directo de la tabla Personal en MySQL (campo FECH_NAC)
# Sin filtro de empresa — muestra cumpleaños de TODAS las empresas
@router.get("/cumpleanos")
async def cumpleanos_mes(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    mes_actual = datetime.now().month

    lista = empleados_activos_query(db).filter(
        extract('month', Personal.FECH_NAC) == mes_actual
    ).all()

    # Deduplicar por ID_PERSONAL (un empleado puede tener varios contratos)
    vistos = set()
    resultado = []
    for p in lista:
        if p.ID_PERSONAL in vistos:
            continue
        vistos.add(p.ID_PERSONAL)
        resultado.append({
            "nombre": f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            "dia": p.FECH_NAC.day,
            "foto": p.FOTO,
        })

    resultado.sort(key=lambda x: x["dia"])
    return resultado
