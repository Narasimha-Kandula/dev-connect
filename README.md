# DevConnect

A developer-collaboration SaaS: discover → match → chat → collaborate → build.
Monorepo with three top-level folders:

```
DevConnect/
  frontend/    # Next.js 16 + Tailwind v4 (App Router)
  backend/     # NestJS 11 + Prisma 7 + PostgreSQL (Supabase)
  database/    # Raw SQL schema/seed mirroring the Prisma schema
  docker-compose.yml   # local Redis + Meilisearch
```

## Quick start

```bash
# 1. Infra (Redis + Meilisearch) — Postgres lives on Supabase, no local container needed
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env        # fill in your real Supabase/Redis/Resend values — see note below
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run start:dev           # http://localhost:4000/api/v1

# 3. Frontend
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev                 # http://localhost:3000
```

## ⚠️ About the credentials you shared

The `.env` block you pasted earlier (Supabase keys, DB password, Redis
password, Resend API key) contained **real, working secrets**. Every `.env*`
file in this project uses **placeholders only** — nothing real was written to
disk. Because those values were shared in plaintext in this conversation,
please rotate them before using this project for real:

- Supabase → Project Settings → API → regenerate anon/service-role keys, and
  reset the database password (Project Settings → Database).
- Redis → set a new password on your Upstash instance.
- Resend → revoke and reissue the API key.
- Generate a fresh `JWT_SECRET` with `openssl rand -hex 32`.

## Tech stack (latest supported versions as of this build)

| Layer      | Choice                                    |
|------------|--------------------------------------------|
| Frontend   | Next.js 16, React 19, Tailwind CSS v4, next-themes |
| Backend    | NestJS 11, Prisma 7, TypeScript 7          |
| Database   | PostgreSQL via Supabase                    |
| Realtime   | Socket.IO (chat), BullMQ + Redis (queues)  |
| Search     | Meilisearch                                |
| Email      | Resend                                     |

## What's implemented

- **Auth**: email/password (bcrypt + JWT access/refresh, rotating sessions), OAuth buttons stubbed for GitHub/Google
- **Profiles & skills**: profile CRUD, completeness score, skill tagging
- **Discovery & matching**: swipe feed, mutual-like → match → auto-created conversation, connections
- **Chat**: REST history + Socket.IO gateway (typing indicators, live messages)
- **Projects**: create/list/detail, join requests, task board
- **Notifications**: in-app notification records for matches/messages
- **Admin**: RBAC-guarded user moderation, reports, analytics summary, audit logs
- **Frontend pages**: landing, login/signup/forgot/reset password, dashboard, discover (swipe UI), matches, chat, profile, projects (list/create/detail), settings, 404/500
- **Theme**: full light/dark color system (indigo/violet primary, cyan accent, warm "match" color) via Tailwind v4 `@theme` tokens + `next-themes`

## What's stubbed / left for you to extend

- Live coding collaboration (shared editor), video/WebRTC rooms, hackathons/leaderboard/achievements pages, AI matching model (flag `ENABLE_AI_MATCHING` is wired but no model behind it yet), GitHub/OAuth token exchange, Meilisearch indexing jobs, BullMQ queue consumers, email templates via Resend.
