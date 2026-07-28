# DevConnect — Runbook

## Prerequisites

- Node.js >= 20
- pnpm or npm
- Docker (for Redis + Meilisearch)
- Supabase account (or any PostgreSQL)

## 1. Environment Variables

```bash
cp backend/.env.example backend/.env   # edit with your values
cp frontend/.env.local.example frontend/.env.local
```

Required variables in `backend/.env`:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `DIRECT_URL` — direct (non-pooled) Supabase connection
- `JWT_SECRET` — any UUID
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth App
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth App

Required variables in `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL` — default `http://localhost:4000/api/v1`
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## 2. Start Infrastructure (Docker)

```bash
docker compose up -d
```

Starts Redis (`:6379`) and Meilisearch (`:7700`).

## 3. Database (Prisma + Supabase)

```bash
cd backend
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss
npm run seed
```

Creates tables, seeds skills + admin user (`admin@devconnect.dev` / `ChangeMe123!`).

## 4. Start Backend

```bash
cd backend
npm run build       # npx nest build
npm run start:dev   # hot-reload on :4000
```

or production:

```bash
npm run build
npm run start:prod  # node dist/main
```

## 5. Start Frontend

```bash
cd frontend
npm run dev         # Next.js on :3000 with Turbopack
```

or production:

```bash
npm run build
npm run start       # next start on :3000
```

## 6. Verify

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:4000/api/v1 |
| Redis    | localhost:6379               |
| Meili    | http://localhost:7700        |

Test login:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@devconnect.dev","password":"ChangeMe123!"}'
```

## Common Commands

```bash
# Prisma migrations (dev — interactive)
cd backend && npx prisma migrate dev --name <name> --schema=src/prisma/schema.prisma

# Prisma migrations (deploy — non-interactive)
cd backend && npx prisma migrate deploy --schema=src/prisma/schema.prisma

# Push schema changes directly (non-interactive)
cd backend && npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss

# Prisma Studio
cd backend && npx prisma studio --schema=src/prisma/schema.prisma

# Re-seed database
cd backend && npx tsx src/prisma/seed.ts

# Docker logs
docker compose logs -f

# Rebuild backend
cd backend && npm run build && npm run start

# Kill processes on 3000/4000
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```
