# DevConnect — Database

PostgreSQL, hosted on Supabase. There are two equally valid ways to manage it:

## Option A — Prisma (recommended for ongoing dev)

```bash
cd backend
npm run prisma:migrate -- --name init
npm run seed
```

Prisma will generate and track migrations under `backend/prisma/migrations`.

## Option B — Raw SQL (bootstrap / manual review)

Run in the Supabase SQL editor, or:

```bash
psql "$DIRECT_URL" -f database/schema.sql
psql "$DIRECT_URL" -f database/seed.sql
```

`schema.sql` mirrors `backend/src/prisma/schema.prisma` table-for-table —
useful for reviewing the full DDL in one place or bootstrapping a fresh
Supabase project without running the Nest app first.

## Notes

- All primary keys are UUIDs (`gen_random_uuid()` via `pgcrypto`).
- RLS is enabled on `users`, `profiles`, `messages`, `notifications`. The
  backend connects via the Supabase **service role** key, which bypasses RLS —
  add further policies here only if you query these tables directly from the
  browser with the anon key.
- Keep `schema.sql` in sync manually if you edit `schema.prisma` directly,
  or regenerate it with `prisma migrate diff` if you prefer automation.
