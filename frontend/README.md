# DevConnect — Frontend (Next.js 16 + Tailwind v4)

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your real Supabase values
npm run dev
```

Runs on `http://localhost:3000`. Talks to the backend API at
`NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api/v1`).

## Theme

Colors are defined as CSS variables in `app/globals.css` using Tailwind v4's
`@theme` directive, with a `.dark` class override toggled by `next-themes`.
Palette: indigo/violet primary, cyan accent, warm "match" pink-red, plus
standard success/warning/danger semantic colors — all tuned for AA contrast
in both light and dark mode.

## Structure

```
app/
  (auth)/login, signup, forgot-password, reset-password
  dashboard, discover, matches, chat, profile, projects, settings
  layout.tsx, globals.css, not-found.tsx, global-error.tsx
components/
  navbar.tsx, theme-provider.tsx, theme-toggle.tsx
  ui/button.tsx, ui/card.tsx
lib/
  api.ts               # typed fetch wrapper for the NestJS backend
  supabase/client.ts    # browser Supabase client
  supabase/server.ts    # server-component Supabase client
```
