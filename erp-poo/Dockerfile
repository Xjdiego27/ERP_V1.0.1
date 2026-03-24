# ═══════════════════════════════════════════════════════════
# Dockerfile — Frontend ERP (Vite + React)
# Multi-stage: Node 20 (build) → Nginx (serve)
# Puerto: 80
# Nginx también actúa como reverse proxy para
# el Chat Backend (/chat/, /socket.io/)
# ═══════════════════════════════════════════════════════════

# ── Etapa 1: Build con Node ──
FROM node:20-alpine AS build

WORKDIR /app

# Copiar solo package files primero (cache de npm ci)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copiar el resto del código fuente
COPY . .

# Variables de entorno para el build de Vite
ARG VITE_API_URL=http://localhost:8000
ARG VITE_CHAT_URL=

# Build de producción
RUN npm run build

# ── Etapa 2: Servir con Nginx ──
FROM nginx:1.27-alpine

# Eliminar config default de Nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copiar build estático
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crear directorio para assets compartidos (volumen)
RUN mkdir -p /usr/share/nginx/html/assets \
    && chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
