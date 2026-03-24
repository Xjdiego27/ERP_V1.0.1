# ═══════════════════════════════════════════════════════════
# Dockerfile — Chat Backend (FastAPI + Socket.IO)
# Puerto interno: 8001 (NO expuesto al host, via Nginx)
# Seguridad: usuario no-root, sin cache pip, imagen slim
# ═══════════════════════════════════════════════════════════

# ── Etapa 1: Instalar dependencias ──
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Etapa 2: Imagen de producción ──
FROM python:3.11-slim

WORKDIR /app

# Copiar paquetes instalados desde builder
COPY --from=builder /install /usr/local

# Crear usuario no-root y directorio de uploads
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app

# Copiar código
COPY --chown=appuser:appuser . .

# Cambiar a usuario no-root
USER appuser

EXPOSE 8001

CMD ["uvicorn", "chat_server:app", "--host", "0.0.0.0", "--port", "8001"]
