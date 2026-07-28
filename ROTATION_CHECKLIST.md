# Secret Rotation Checklist

Treat all current secrets as compromised. Execute in order:

## 1. JWT_SECRET
```bash
openssl rand -hex 32
```
Update in: backend/.env, Railway dashboard env vars
Impact: Invalidates all existing JWT tokens (users will need to re-login)

## 2. DATABASE_URL / DIRECT_URL
- Rotate DB password in Supabase Dashboard → Project Settings → Database
- Update both URLs in: backend/.env, Railway dashboard
- Old sessions with stale connections will fail gracefully

## 3. Redis Password (Upstash)
- Rotate in Upstash Console → Settings → Password
- Update in: backend/.env, Railway dashboard
- Redis will reject old connections on disconnect/reconnect

## 4. Meilisearch API Key
- Rotate in Meilisearch Cloud dashboard → API Keys
- Update in: backend/.env, Railway dashboard
- Search will return 403 until updated

## 5. OAuth Client Secrets
- **GitHub**: https://github.com/settings/developers → regenerate secret
- **Google**: https://console.cloud.google.com/apis/credentials → regenerate
- Update both in: backend/.env, Railway dashboard
- OAuth logins will fail until both sides match

## 6. Resend API Key
- Rotate in Resend dashboard → API Keys
- Update in: backend/.env, Railway dashboard
- Transactional emails will fail to send

## 7. Frontend .env.local
- Remove Supabase keys (unused): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Keep public OAuth client IDs (these are safe to be public by design)
- No real secrets should live in frontend/.env.local

## Verification
After each rotation:
1. Backend health: `curl https://devconnect-backend.up.railway.app/api/v1`
2. Login flow: Sign in via email/password and OAuth
3. Search: Execute a Meilisearch query
4. Email: Trigger a password reset email
