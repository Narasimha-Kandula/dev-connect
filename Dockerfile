# ── Stage 1: Build ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

# ── Stage 2: Production ────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src/prisma ./src/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy start script
COPY backend/start.sh ./
RUN chmod +x start.sh

# Copy migration files for prisma migrate deploy
COPY backend/src/prisma/migrations ./src/prisma/migrations

USER nestjs
EXPOSE 4000

# start.sh runs:
#   1. prisma migrate deploy  (applies pending DB migrations)
#   2. node dist/main        (starts the NestJS app)
CMD ["./start.sh"]
