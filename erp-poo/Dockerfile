# ═══════════════════════════════════════════════
# Dockerfile — Frontend ERP (Vite + React)
# Build multistage: Node → Nginx
# ═══════════════════════════════════════════════

# ── Etapa 1: Build ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Variables de entorno para el build (se inyectan desde docker-compose)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_CHAT_URL=http://localhost:8001

RUN npm run build

# ── Etapa 2: Servir con Nginx ──
FROM nginx:alpine

# Copiar build a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
