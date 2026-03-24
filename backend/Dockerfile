# ═══════════════════════════════════════════════
# Dockerfile — Backend API Principal (FastAPI)
# Puerto: 8000
# ═══════════════════════════════════════════════
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema para PyMySQL, cryptography, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] sqlalchemy pymysql python-jose[cryptography] \
    python-dotenv pydantic pydantic-settings motor python-multipart \
    argon2-cffi python-docx reportlab

# Copiar código del backend
COPY . .

# Puerto de la API
EXPOSE 8000

# Arrancar con uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
