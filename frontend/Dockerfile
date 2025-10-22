# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Build args for client/runtime
ARG NEXT_PUBLIC_APP_NAME="Fractal Search Engine"
ARG GOOGLE_API_KEY=""
ARG GOOGLE_CX_ID=""
ARG GEMINI_API_KEY=""
ARG ELASTICSEARCH_URL=""
ARG ELASTICSEARCH_API_KEY=""

# Persist envs during build (client needs NEXT_PUBLIC_*)
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    GOOGLE_API_KEY=$GOOGLE_API_KEY \
    GOOGLE_CX_ID=$GOOGLE_CX_ID \
    GEMINI_API_KEY=$GEMINI_API_KEY \
    ELASTICSEARCH_URL=$ELASTICSEARCH_URL \
    ELASTICSEARCH_API_KEY=$ELASTICSEARCH_API_KEY

# Install deps and build
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone server and assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Re-expose envs at runtime
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    GOOGLE_API_KEY=$GOOGLE_API_KEY \
    GOOGLE_CX_ID=$GOOGLE_CX_ID \
    GEMINI_API_KEY=$GEMINI_API_KEY \
    ELASTICSEARCH_URL=$ELASTICSEARCH_URL \
    ELASTICSEARCH_API_KEY=$ELASTICSEARCH_API_KEY \
    PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]