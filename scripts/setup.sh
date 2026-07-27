#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
log_err() { echo -e "${RED}[✗]${NC} $1"; }

echo "┌──────────────────────────────────────────┐"
echo "│       DevConnect — Setup Checker         │"
echo "└──────────────────────────────────────────┘"
echo ""

# ─── Node version ─────────────────────────────────
REQUIRED_NODE=18
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VER" ]; then
  log_err "Node.js not found. Install Node >= $REQUIRED_NODE."
  HAS_NODE=false
else
  if [ "$NODE_VER" -ge "$REQUIRED_NODE" ]; then
    log_ok "Node.js v$(node -v | sed 's/v//')"
  else
    log_warn "Node.js v$(node -v | sed 's/v//') — expected >= $REQUIRED_NODE"
  fi
  HAS_NODE=true
fi

# ─── Port checks ──────────────────────────────────
check_port() {
  local PORT=$1 SERVICE=$2
  if ss -tlnp "sport = :$PORT" 2>/dev/null | grep -q .; then
    log_warn "Port $PORT — $SERVICE is already in use"
  else
    log_ok "Port $PORT — $SERVICE is available"
  fi
}

check_port 3000 "Frontend"
check_port 4000 "Backend"
check_port 6379 "Redis"
check_port 7700 "Meilisearch"

# ─── Docker containers ────────────────────────────
if command -v docker &>/dev/null; then
  CONTAINERS=$(docker ps --format '{{.Names}}' 2>/dev/null)
  for name in devconnect-redis devconnect-meilisearch; do
    if echo "$CONTAINERS" | grep -q "$name"; then
      log_ok "Docker container '$name' is running"
    else
      log_warn "Docker container '$name' is not running — start with: docker compose up -d"
    fi
  done
else
  log_warn "Docker not found. Cannot verify containers."
fi

# ─── npm dependencies ─────────────────────────────
if [ "$HAS_NODE" = true ]; then
  if [ -f backend/node_modules/.package-lock.json ]; then
    log_ok "Backend dependencies installed"
  else
    log_warn "Backend dependencies missing — run: npm --prefix backend install"
  fi

  if [ -f frontend/node_modules/.package-lock.json ]; then
    log_ok "Frontend dependencies installed"
  else
    log_warn "Frontend dependencies missing — run: npm --prefix frontend install"
  fi
fi

# ─── Environment files ────────────────────────────
[ -f backend/.env ]       && log_ok "backend/.env exists"       || log_err "backend/.env missing"
[ -f frontend/.env.local ] && log_ok "frontend/.env.local exists" || log_err "frontend/.env.local missing"

# ─── Database check (via psql) ────────────────────
if command -v psql &>/dev/null; then
  DB_URL="${DATABASE_URL:-postgresql://postgres.ybytnrdxqrrjbrxfhofv:dev-connect436@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres}"
  if PGPASSWORD="${DB_URL#*://*:}" PGPASSWORD="${PGPASSWORD%@*}" \
       psql -h "$(echo "$DB_URL" | sed 's/.*@//;s/:.*//')" \
            -p "$(echo "$DB_URL" | sed 's/.*://;s/\/.*//;s/@.*//')" \
            -U "$(echo "$DB_URL" | sed 's/.*\/\///;s/:.*//')" \
            -d postgres -c "SELECT 1" &>/dev/null; then
    log_ok "Database reachable"
  else
    log_warn "Database unreachable — check DATABASE_URL or VPN/network"
  fi
else
  log_warn "psql not found — skipping database connectivity check"
fi

echo ""
echo "────────────────────────────────────────────"
echo "To start the project:"
echo "  docker compose up -d          # Redis + Meilisearch"
echo "  npx prisma migrate deploy     # Apply migrations"
echo "  npm --prefix backend run start:dev"
echo "  npm --prefix frontend run dev"
echo "────────────────────────────────────────────"
