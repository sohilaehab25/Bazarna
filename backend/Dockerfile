# ============================================================
# Stage 1: Install ALL dependencies (needed for TS compile)
# ============================================================
FROM node:20-alpine AS ts-builder

WORKDIR /app

COPY package*.json ./
# Install all deps (including devDependencies for tsc)
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ============================================================
# Stage 2: Install PRODUCTION-only dependencies
# ============================================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 3: Lean production image
# ============================================================
FROM node:20-alpine AS production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Only copy the compiled output + production node_modules
COPY --from=prod-deps  /app/node_modules ./node_modules
COPY --from=ts-builder /app/dist         ./dist
COPY package*.json ./

# Create log directory with correct ownership
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
