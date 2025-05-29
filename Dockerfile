version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/app/data/distributor.db
      # ✅ Variables de entorno para Coolify
      - SERVICE_FQDN_APP_3000
    volumes:
      # ✅ Volumen nombrado en lugar de bind mount
      - app_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    # ✅ Configuración de red para Coolify
    networks:
      - default

volumes:
  app_data:
    driver: local

<<<<<<< HEAD
# Install server dependencies
RUN npm ci --only=production

# Install client dependencies
WORKDIR /app/client
RUN npm ci --only=production

# Build stage for React client
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies (including dev dependencies for build)
RUN npm install
WORKDIR /app/client
RUN npm install

# Build React client
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 whatsapp

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=whatsapp:nodejs /app/server.js ./
COPY --from=builder --chown=whatsapp:nodejs /app/client/build ./client/build

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown whatsapp:nodejs /app/data

# Switch to non-root user
USER whatsapp

# Expose port (Coolify usa 3000 por defecto)
EXPOSE 3000

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/stats || exit 1

# Start the application
CMD ["node", "server.js"]
=======
# ✅ Red externa que Coolify maneja automáticamente
networks:
  default:
    external: true
    name: ${COOLIFY_NETWORK:-coolify}
>>>>>>> d753066b61355492452cca016383cac43724652c
