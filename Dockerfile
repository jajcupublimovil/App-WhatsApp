# syntax=docker.io/docker/dockerfile:1
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files for both server and client
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/

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
ENV PORT=5000

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

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 5000, path: '/api/stats', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "server.js"]