#!/bin/sh
# ── Pre-deploy verification ──
# Run this locally before pushing to ensure everything is clean.
# Usage: ./scripts/verify.sh
set -e

echo "═══════════════════════════════════════"
echo "  DevConnect — Pre-deploy Verification"
echo "═══════════════════════════════════════"

# ── Backend ──
echo ""
echo "── Backend ──"
cd backend

echo "  → Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund >/dev/null 2>&1

echo "  → Generating Prisma Client..."
npx prisma generate --schema=src/prisma/schema.prisma >/dev/null 2>&1

echo "  → Linting..."
npm run lint

echo "  → Typechecking..."
npm run typecheck

echo "  → Building..."
npm run build

cd ..

# ── Frontend ──
echo ""
echo "── Frontend ──"
cd frontend

echo "  → Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund >/dev/null 2>&1

echo "  → Linting..."
npm run lint

echo "  → Typechecking..."
npm run typecheck

echo "  → Building..."
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 \
NEXT_PUBLIC_WS_URL=http://localhost:4000 \
NEXT_PUBLIC_GITHUB_CLIENT_ID=placeholder \
NEXT_PUBLIC_GOOGLE_CLIENT_ID=placeholder \
npm run build

cd ..

echo ""
echo "═══════════════════════════════════════"
echo "  All checks passed. Safe to push."
echo "═══════════════════════════════════════"
