# ═══════════════════════════════════════════════════════════
# Dockerfile — Huellero (Sincronización ZK → MongoDB)
# Multi-stage build, non-root, imagen mínima
# ═══════════════════════════════════════════════════════════

FROM python:3.12-slim AS base

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY Asistencias.py .

# Cambiar a usuario no-root
USER appuser

# El script corre en loop infinito (sleep 300 entre sincronizaciones)
CMD ["python", "-u", "Asistencias.py"]
