# Multi-stage Docker build for AI-powered search engine

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build

# Stage 3: Build scripts
FROM node:18-alpine AS scripts-builder
WORKDIR /app/scripts
COPY scripts/package*.json ./
RUN npm ci --only=production
COPY scripts/ ./
RUN npm run build

# Stage 4: Production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy built applications
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

COPY --from=scripts-builder /app/scripts/dist ./scripts/dist
COPY --from=scripts-builder /app/scripts/package*.json ./scripts/
COPY --from=scripts-builder /app/scripts/node_modules ./scripts/node_modules

# Copy root package.json for orchestration
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Default command (can be overridden)
CMD ["npm", "start"]
