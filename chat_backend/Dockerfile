# ═══════════════════════════════════════════════
# Dockerfile — Chat Backend (FastAPI + Socket.IO)
# Puerto: 8001
# ═══════════════════════════════════════════════
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Directorio de uploads
RUN mkdir -p /app/uploads

EXPOSE 8001

CMD ["uvicorn", "chat_server:app", "--host", "0.0.0.0", "--port", "8001"]
