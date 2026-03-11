from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db, Personal, Contrato, Acceso, Cargo
from auth_token import verificar_token

router = APIRouter()


# === CUMPLEAÑOS DEL MES ===
# Lee directo de la tabla Personal en MySQL (campo FECH_NAC)
# Filtra por empresa del token via Contrato vigente
@router.get("/cumpleanos")
async def cumpleanos_mes(db: Session = Depends(get_db), token: dict = Depends(verificar_token)):
    mes_actual = datetime.now().month
    id_empresa = token.get("id_emp")

    lista = db.query(Personal).join(
        Acceso, Acceso.ID_ACCS == Personal.ID_ACCS
    ).join(
        Contrato, Contrato.ID_PERSONAL == Personal.ID_PERSONAL
    ).join(
        Cargo, Cargo.ID_CARGO == Contrato.ID_CARGO
    ).filter(
        Acceso.ID_ESTADO == 1,
        Cargo.ID_EMP == id_empresa,
        Contrato.ID_ESTADO_CONTRATO == 1,
        extract('month', Personal.FECH_NAC) == mes_actual
    ).all()

    resultado = []
    for p in lista:
        resultado.append({
            "nombre": f"{p.NOMBRES} {p.APE_PATERNO} {p.APE_MATERNO}",
            "dia": p.FECH_NAC.day,
            "foto": p.FOTO,
        })

    resultado.sort(key=lambda x: x["dia"])
    return resultado
