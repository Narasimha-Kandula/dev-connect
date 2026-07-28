# DevConnect — Backend (NestJS 11 + Prisma 7 + PostgreSQL)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your real Supabase/Redis/Resend values
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed             # creates sample skills + admin@devconnect.dev (password printed to console)
npm run start:dev
```

API base URL: `http://localhost:4000/api/v1`
WebSocket chat namespace: `ws://localhost:4000/ws/chat` (send JWT as `auth.token`)

## Structure

```
src/
  config/            # typed env config
  common/            # guards, decorators, filters shared across modules
  prisma/            # schema.prisma, PrismaService, seed script
  modules/
    auth/            # register, login, refresh, logout (JWT + bcrypt)
    users/           # profile CRUD, skills
    skills/          # skill directory/search
    discovery/       # swipe feed (recommendation candidates)
    matching/        # swipe action, mutual-match creation, connections
    chat/             # REST history + Socket.IO gateway
    projects/         # project CRUD, join requests, task board
    notifications/    # in-app notification creation/read state
    admin/             # RBAC-guarded moderation & analytics
```

## Security notes

- Never commit a real `.env`. Only `.env.example` (with placeholders) is tracked.
- Rotate any credential that has ever been pasted into a chat, doc, or ticket.
- `JWT_SECRET` should be a long random string — generate with `openssl rand -hex 32`.
