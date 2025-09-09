# =====================================================
# DOCKERFILE: LOGISTICS MODULE PRODUCTION
# Descripción: Configuración Docker optimizada para el módulo de logística
# Basado en: Multi-stage build + Alpine Linux + Node.js 18
# =====================================================

# =====================================================
# STAGE 1: DEPENDENCIES
# =====================================================
FROM node:18-alpine AS deps

# Instalar dependencias del sistema necesarias para MapLibre GL JS
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias con cache optimizado
RUN npm ci --only=production --frozen-lockfile

# =====================================================
# STAGE 2: BUILDER
# =====================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias desde stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build optimizado para logística
RUN npm run build:logistics

# =====================================================
# STAGE 3: RUNNER
# =====================================================
FROM node:18-alpine AS runner

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Instalar dependencias runtime mínimas
RUN apk add --no-cache \
    dumb-init \
    curl

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Configurar variables de entorno
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Exponer puerto
EXPOSE 3000

# Cambiar a usuario no-root
USER nextjs

# Health check optimizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio con dumb-init para manejo de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# =====================================================
# LABELS PARA METADATA
# =====================================================
LABEL maintainer="santiago@xor.com.ar"
LABEL version="1.0.0"
LABEL description="Pinteya E-commerce Logistics Module"
LABEL org.opencontainers.image.source="https://github.com/SantiagoXOR/pinteya-ecommerce"
