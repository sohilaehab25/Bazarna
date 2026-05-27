# ============================================================
# Stage 1: Build Angular SSR application
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Production SSR build
RUN npm run build -- --configuration=production

# ============================================================
# Stage 2: Install production-only dependencies
# ============================================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 3: Lean production image (Angular SSR server)
# ============================================================
FROM node:20-alpine AS production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=prod-deps  /app/node_modules            ./node_modules
COPY --from=builder    /app/dist                    ./dist
COPY package*.json ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/ || exit 1

CMD ["node", "dist/bazarna/server/server.mjs"]
