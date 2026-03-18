# ============================================
# RUTAS PLANTILLAS — Generación de documentos
# a partir de plantillas DOCX con placeholders
# que se llenan con datos de la BD y/o selección
# ============================================

import os
import re
from io import BytesIO
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
from docx import Document as DocxDocument

from database import (
    get_db, Personal, Contrato, Distrito
)
from auth_token import verificar_token

router = APIRouter()

# Carpeta de plantillas DOCX
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")


# ─── HELPERS ────────────────────────────────────

def _numero_a_texto(n):
    """Convierte un número a su representación en texto en español."""
    unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
    decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
               'sesenta', 'setenta', 'ochenta', 'noventa']
    especiales = {
        11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
        16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
        21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
        25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho',
        29: 'veintinueve',
    }
    centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
                'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

    if n == 0:
        return 'cero'
    if n == 100:
        return 'cien'

    resultado = ''

    if n >= 1000:
        miles = n // 1000
        resto = n % 1000
        if miles == 1:
            resultado = 'mil'
        else:
            resultado = _numero_a_texto(miles) + ' mil'
        if resto > 0:
            resultado += ' ' + _numero_a_texto(resto)
        return resultado.strip()

    if n >= 100:
        resultado = centenas[n // 100]
        resto = n % 100
        if resto > 0:
            resultado += ' ' + _numero_a_texto(resto)
        return resultado.strip()

    if n in especiales:
        return especiales[n]

    if n >= 10:
        d = n // 10
        u = n % 10
        if u == 0:
            return decenas[d]
        return decenas[d] + ' y ' + unidades[u]

    return unidades[n]


def _sueldo_a_texto(sueldo_str):
    """Convierte un sueldo como '2500.00' a 'dos mil quinientos con 00/100 soles'."""
    try:
        monto = float(str(sueldo_str).replace(',', ''))
        entero = int(monto)
        decimales = int(round((monto - entero) * 100))
        texto = _numero_a_texto(entero)
        return f"{texto} con {decimales:02d}/100 soles"
    except (ValueError, TypeError):
        return str(sueldo_str) if sueldo_str else ''


MESES_ES = {
    1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
    5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
    9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
}


def _obtener_datos_auto(id_personal: int, db: Session):
    """Extrae datos automáticos del empleado desde la BD."""
    persona = db.query(Personal).filter(Personal.ID_PERSONAL == id_personal).first()
    if not persona:
        return {}

    contrato = db.query(Contrato).filter(
        Contrato.ID_PERSONAL == id_personal,
        Contrato.ID_ESTADO_CONTRATO == 1
    ).first()

    # Distrito
    distrito_nombre = ''
    depart_y_provinc = ''
    id_distr = getattr(persona, 'ID_DISTR', None)
    if id_distr and Distrito:
        dist = db.query(Distrito).filter(Distrito.ID_DISTR == id_distr).first()
        if dist:
            distrito_nombre = dist.DESCRIP if hasattr(dist, 'DESCRIP') else ''

    # Departamento y Provincia (del área/departamento del contrato)
    if contrato and hasattr(contrato, 'ID_AREA'):
        area = db.query(Area).filter(Area.ID_AREA == contrato.ID_AREA).first() if contrato.ID_AREA else None

    # Dirección
    direccion = getattr(persona, 'DIRECCION', '') or ''

    # Sueldo del contrato vigente
    sueldo = ''
    if contrato and hasattr(contrato, 'SUELDO'):
        sueldo = str(contrato.SUELDO) if contrato.SUELDO else ''

    hoy = datetime.now()

    datos = {
        'nombres': persona.NOMBRES if persona.NOMBRES else '',
        'ape_paterno': persona.APE_PATERNO if persona.APE_PATERNO else '',
        'ape_materno': persona.APE_MATERNO if persona.APE_MATERNO else '',
        'num_doc': persona.NUM_DOC if persona.NUM_DOC else '',
        'direccion': direccion,
        'distrito': distrito_nombre,
        'depart_y_provinc': depart_y_provinc,
        # Fecha de generación
        'dia que se genera': str(hoy.day),
        'mes que se genera': MESES_ES.get(hoy.month, ''),
        'año que se genera': str(hoy.year),
        # Sueldo
        'sueldo (en numeros)': sueldo,
        'sueldo en texto': _sueldo_a_texto(sueldo) if sueldo else '',
    }
    return datos


def _extraer_placeholders(doc_path: str):
    """Extrae todos los placeholders {campo} de un documento DOCX."""
    doc = DocxDocument(doc_path)
    placeholders = set()

    for para in doc.paragraphs:
        texto = para.text
        matches = re.findall(r'\{([^}]+)\}', texto)
        placeholders.update(matches)

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    matches = re.findall(r'\{([^}]+)\}', para.text)
                    placeholders.update(matches)

    return list(placeholders)


# Campos que se llenan automáticamente desde la BD
CAMPOS_AUTO = {
    'nombres', 'ape_paterno', 'ape_materno', 'num_doc',
    'direccion', 'distrito', 'depart_y_provinc',
    'dia que se genera', 'mes que se genera', 'año que se genera',
    'sueldo (en numeros)', 'sueldo en texto',
}


def _clasificar_campos(placeholders):
    """Clasifica cada placeholder como 'auto' o 'manual'."""
    resultado = []
    for campo in sorted(placeholders):
        tipo = 'auto' if campo in CAMPOS_AUTO else 'manual'
        resultado.append({'campo': campo, 'tipo': tipo})
    return resultado


def _reemplazar_en_parrafo(para, datos):
    """Reemplaza placeholders en un párrafo preservando formato."""
    texto_completo = para.text
    if '{' not in texto_completo:
        return

    # Intentar reemplazo run por run primero
    # Si el placeholder está dividido entre runs, reconstruir
    runs_text = ''.join(run.text for run in para.runs)
    if runs_text != texto_completo:
        # Paragraph text comes from XML, runs may not match
        pass

    for key, val in datos.items():
        placeholder = '{' + key + '}'
        if placeholder in texto_completo:
            texto_completo = texto_completo.replace(placeholder, str(val))

    # Reconstruir runs preservando formato del primer run
    if para.runs:
        for i, run in enumerate(para.runs):
            if i == 0:
                run.text = texto_completo
            else:
                run.text = ''
    else:
        para.text = texto_completo


def _rellenar_documento(doc_path: str, datos: dict):
    """Abre el DOCX, reemplaza placeholders y retorna el documento."""
    doc = DocxDocument(doc_path)

    for para in doc.paragraphs:
        _reemplazar_en_parrafo(para, datos)

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    _reemplazar_en_parrafo(para, datos)

    return doc


# ─── SCHEMAS ────────────────────────────────────

class GenerarDocumentoRequest(BaseModel):
    campos_manuales: Dict[str, str] = {}


# ─── ENDPOINTS ──────────────────────────────────

@router.get("/plantillas")
def listar_plantillas(token: dict = Depends(verificar_token)):
    """Lista las plantillas DOCX disponibles en la carpeta templates."""
    if not os.path.isdir(TEMPLATES_DIR):
        return []

    archivos = []
    for f in os.listdir(TEMPLATES_DIR):
        if f.lower().endswith('.docx') and not f.startswith('~$'):
            nombre_sin_ext = os.path.splitext(f)[0]
            archivos.append({
                'archivo': f,
                'nombre': nombre_sin_ext,
            })
    return archivos


@router.get("/plantillas/{nombre_archivo}/campos")
def obtener_campos_plantilla(
    nombre_archivo: str,
    id_personal: int = Query(...),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token)
):
    """Analiza una plantilla y retorna sus campos clasificados como auto/manual,
    incluyendo los valores automáticos ya resueltos desde la BD."""

    ruta = os.path.join(TEMPLATES_DIR, nombre_archivo)
    if not os.path.isfile(ruta):
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    placeholders = _extraer_placeholders(ruta)
    campos = _clasificar_campos(placeholders)
    datos_auto = _obtener_datos_auto(id_personal, db)

    # Agregar el valor auto si está disponible
    for c in campos:
        if c['tipo'] == 'auto':
            c['valor'] = datos_auto.get(c['campo'], '')

    return {
        'archivo': nombre_archivo,
        'campos': campos,
    }


@router.post("/plantillas/{nombre_archivo}/generar")
def generar_documento(
    nombre_archivo: str,
    data: GenerarDocumentoRequest,
    id_personal: int = Query(...),
    formato: str = Query('docx', regex='^(docx|pdf)$'),
    db: Session = Depends(get_db),
    token: dict = Depends(verificar_token)
):
    """Genera el documento rellenado con datos auto + manuales.
    Retorna el archivo DOCX (o PDF si se especifica formato=pdf)."""

    ruta = os.path.join(TEMPLATES_DIR, nombre_archivo)
    if not os.path.isfile(ruta):
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Datos automáticos de la BD
    datos_auto = _obtener_datos_auto(id_personal, db)

    # Combinar: auto + manuales (los manuales sobreescriben si coinciden)
    datos_final = {**datos_auto, **data.campos_manuales}

    # Rellenar el documento
    doc = _rellenar_documento(ruta, datos_final)

    # Guardar en memoria
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    nombre_descarga = os.path.splitext(nombre_archivo)[0]

    if formato == 'pdf':
        # Para PDF necesitamos convertir — intenta usar docx2pdf o libreoffice
        try:
            import subprocess
            import tempfile

            # Guardar DOCX temporal
            tmp_docx = os.path.join(tempfile.gettempdir(), f"temp_{nombre_descarga}.docx")
            tmp_pdf = os.path.join(tempfile.gettempdir(), f"temp_{nombre_descarga}.pdf")

            with open(tmp_docx, 'wb') as f:
                f.write(buffer.getvalue())

            # Intentar con LibreOffice
            try:
                subprocess.run([
                    'soffice', '--headless', '--convert-to', 'pdf',
                    '--outdir', tempfile.gettempdir(), tmp_docx
                ], check=True, timeout=30, capture_output=True)
            except FileNotFoundError:
                # Intentar con libreoffice en path completo (Windows)
                lo_paths = [
                    r'C:\Program Files\LibreOffice\program\soffice.exe',
                    r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
                ]
                converted = False
                for lo_path in lo_paths:
                    if os.path.isfile(lo_path):
                        subprocess.run([
                            lo_path, '--headless', '--convert-to', 'pdf',
                            '--outdir', tempfile.gettempdir(), tmp_docx
                        ], check=True, timeout=30, capture_output=True)
                        converted = True
                        break
                if not converted:
                    raise HTTPException(
                        status_code=500,
                        detail="LibreOffice no encontrado. Instale LibreOffice para generar PDF."
                    )

            if os.path.isfile(tmp_pdf):
                with open(tmp_pdf, 'rb') as f:
                    pdf_bytes = f.read()
                # Limpiar temporales
                os.remove(tmp_docx)
                os.remove(tmp_pdf)

                return StreamingResponse(
                    BytesIO(pdf_bytes),
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f'attachment; filename="{nombre_descarga}.pdf"'
                    }
                )
            else:
                raise HTTPException(status_code=500, detail="Error al convertir a PDF")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")

    # DOCX por defecto
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{nombre_descarga}.docx"'
        }
    )
