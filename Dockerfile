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

# ✅ Red externa que Coolify maneja automáticamente
networks:
  default:
    external: true
    name: ${COOLIFY_NETWORK:-coolify}
