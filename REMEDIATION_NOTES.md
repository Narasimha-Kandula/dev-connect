# Remediation Notes

## Session context
- Working through audit findings in phase order
- Backend: NestJS 11 + Prisma 7 + PostgreSQL (Supabase)
- Frontend: Next.js 16 (middleware.ts, not proxy.ts)
- Deployed: Railway (backend) + Netlify (frontend)

## Issues logged during remediation (not part of original audit)

- `console.log` in `main.ts:53` replaced with NestJS `Logger.log` (noticed while adding startup assertion)

## Breaking changes introduced

(empty — will populate when a fix changes a public API contract)

## Decisions documented

- Auth route backward compat: `/auth/oauth/callback` kept as alias for `/auth/oauth` to avoid breaking old deployed frontend during transition
