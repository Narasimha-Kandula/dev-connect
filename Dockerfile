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

USER nestjs
EXPOSE 4000
CMD ["node", "dist/main"]
