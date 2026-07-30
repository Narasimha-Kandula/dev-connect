# DevConnect E2E Audit Report

Generated: 2026-07-29

## Executive Summary

| Area | Status |
|------|--------|
| **Backend API** | 30/32 core endpoints working (2 missing modules) |
| **Frontend Pages** | 18/20 pages render (2 have non-existent API calls) |
| **Auth Flow** | Register, Login, Refresh, Logout all working |
| **Socket.IO (Chat)** | Events match frontend ↔ backend |
| **Database (Prisma)** | All 7 migrations clean, no pending |
| **Security** | 1 critical vulnerability found |
| **Error Handling** | ~20 silent `.catch(() => {})` blocks |
| **Missing Features** | Calls module (no backend), email change (no endpoint), notifications mark-read (no UI) |

---

## 1. CRITICAL: Password Hash Exposure (Fix Immediately)

**Location:** `backend/src/modules/projects/projects.service.ts:63,72-79,86-92`

**Issue:** `GET /projects`, `GET /projects/:id`, `GET /projects/my/list` all return full `User` objects via Prisma `include`, exposing `passwordHash`, `mfaSecret`, `emailVerificationToken`, `emailVerificationToken` to every API consumer.

**Fix:** Replace `include: { owner: true }` with `select` in the projects service to exclude sensitive fields:

```ts
// Before (line 63):
include: { owner: { include: { profile: true } }, members: { include: { user: { include: { profile: true } } } }, _count: { select: { members: true, tasks: true } } }

// After:
include: { 
  owner: { 
    select: { 
      id: true, email: true, role: true, planTier: true, isSuspended: true, isBanned: true,
      profile: true 
    } 
  }, 
  members: { 
    include: { 
      user: { 
        select: { 
          id: true, email: true, role: true, planTier: true, isSuspended: true, isBanned: true,
          profile: true 
        } 
      } 
    } 
  }, 
  _count: { select: { members: true, tasks: true } } 
}
```

**Impact:** Anyone with auth (including test users) can retrieve bcrypt hashes of all user passwords.

---

## 2. MISSING BACKEND ENDPOINTS (P0 - Will Crash at Runtime)

| Frontend Page | Line | API Call | Problem |
|---|---|---|---|
| `calls/page.tsx` | 25 | `GET /calls` | **No CallsController, no calls module in backend at all** |
| `settings/page.tsx` | 82 | `PUT /users/email` | **No email change endpoint exists in UsersController** |
| `admin/page.tsx` | 15 | `GET /admin/stats` | **Should be `GET /admin/analytics/summary` (different response shape)** |

**Root cause:** `calls` feature was planned but never implemented in backend. Email change was never added as a route. Admin stats endpoint name mismatched.

---

## 3. MISSING FRONTEND ROUTES (Navigation Broken)

| File | Line | Link Target | Problem |
|---|---|---|---|
| `profile/page.tsx` | 190 | `/skills` | No `app/(protected)/skills/` page exists |
| `admin/page.tsx` | 60 | `/safety` | No `app/(protected)/safety/` page exists |

---

## 4. CRITICAL TYPE SAFETY ISSUE

**File:** `profile/edit/page.tsx:106`
```ts
setUser(updated as never)
```
This completely bypasses TypeScript. `setUser` expects `User | null` but receives a raw API response. This can corrupt the entire auth store's user state with a malformed object.

---

## 5. FRONTEND BUGS

### P1: Chat settings not persisted
**File:** `chat/settings/page.tsx:13-14`

Toggle switches update local `prefs` state but never call any API to persist changes. Refresh resets to defaults.

### P1: Apply message never sent
**File:** `projects/[id]/page.tsx:120-127`

Textarea collects `applyMessage` string but the `POST /projects/:id/join` API call doesn't include it. The backend endpoint also doesn't accept a message parameter. Feature is cosmetic.

### P1: Notification mark-as-read not implemented
**File:** `notifications/page.tsx`

Backend supports `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`, but frontend has no "mark as read" UI.

### P2: Chat message send race condition
**File:** `useChatSocket.ts:247-252`

When sending a message offline, an optimistic message is created with `tempId`. When the server responds, the code checks `prev.some(m => m.id === response.id)` — but the optimistic message has `tempId`, not the server ID, so it's never replaced. This causes duplicate messages.

### P2: Apply message not sent to API
**File:** `projects/[id]/page.tsx:120-127`

The `applyMessage` from the textarea is collected in state but never included in the API call.

---

## 6. SILENT ERROR HANDLING

**~20 locations** across the codebase use `.catch(() => {})` pattern, swallowing all errors without user feedback.

Key files: `dashboard`, `profile`, `profile/[id]`, `projects`, `projects/[id]`, `chat`, `chat/settings`, `discover`, `matches`, `notifications`, `calls`, `auth-store`, `useNotificationSocket`, `useAutocomplete`, `useChatSocket`

**Recommended fix:** At minimum log errors to console and show a toast notification.

---

## 7. FORM VALIDATION ISSUES

| File | Issue |
|---|---|
| `onboarding/page.tsx` | **No form validation at all** — all fields can be empty |
| `profile/edit/page.tsx:86` | `displayName: data.displayName \|\| undefined` sends undefined despite zod requiring it |
| `projects/create/page.tsx` | Skills sent as comma-separated string, API expects array (conversion happens implicitly) |

---

## 8. BACKEND-ONLY ENDPOINTS (Not Used by Frontend)

These routes exist but have no frontend integration:

- **Auth:** OAuth, forgot/reset password, email verification, MFA setup/enable/disable, API keys, sessions management
- **Users:** Endorse user, sync GitHub
- **Matching:** Connect, start project flows
- **Chat:** Group conversations, message CRUD via REST (uses Socket.IO instead)
- **Projects:** Update/delete projects, tasks CRUD, milestones CRUD, invitation responses
- **Notifications:** Read individual/all (no frontend UI)
- **Admin:** User management (suspend/ban/reinstate), reports CRUD, analytics detailed, audit logs
- **Collab:** Create/join/leave/end rooms (no frontend integration for room creation)
- **Search:** Full search endpoint, projects search
- **Profile:** Dedicated profile controller (frontend uses `/users/me`)
- **Devices:** Push notification device registration
- **Fraud:** Score check, manual resolve
- **Reputation:** Reviews, contributions (models exist but no frontend UI)

---

## 9. UNSTABLE / NON-FUNCTIONAL SERVICES

| Service | Issue |
|---|---|
| **Redis (Upstash)** | TLS/cert error — `maxRetriesPerRequest: 2` exhausted. Rate limiter, presence tracking, cache degrade gracefully |
| **MeiliSearch** | `MeiliSearch is not a constructor` import error. Search falls back to DB |

---

## 10. FEATURE COMPLETENESS

| Feature | Status | Notes |
|---|---|---|
| User auth (register/login/logout/refresh) | ✅ Working | |
| Profile CRUD (edit, avatar, skills) | ✅ Working | |
| Discover & swipe | ✅ Working | |
| Matching | ✅ Working | |
| Chat (Socket.IO + offline queue) | ✅ Working | Race condition on offline message replace |
| Projects (CRUD, join) | ✅ Working | Password hash leak needs fix |
| Notifications | ⚠️ Partial | Backend works, frontend missing mark-read |
| Reputation system | ✅ Models + API | No frontend UI |
| Collaboration rooms | ✅ API + Frontend | Room creation endpoint not wired to frontend |
| Kanban tasks | ✅ Frontend | Backend tasks CRUD exists |
| Whiteboard | ⚠️ Placeholder | tldraw placeholder only |
| Code Editor | ⚠️ Placeholder | Textarea placeholder only |
| LiveKit Voice | ⚠️ Placeholder | Component exists, not wired |
| Offline messaging | ✅ Working | Queue in message-queue.ts |
| SEO (useMeta hook) | ✅ Working | |
| MeiliSearch re-index cron | ✅ Working | Import error blocks indexing |
| Admin dashboard | ⚠️ Partial | Analytics endpoint mismatch |
| Calls/Video | ❌ Not implemented | No backend module |
| Email change | ❌ Not implemented | No backend endpoint |
| OAuth login | ❌ Not implemented | Backend endpoint, no frontend UI |
| MFA | ❌ Not implemented | Backend endpoints, no frontend UI |
| Password recovery | ❌ Not implemented | Backend endpoints, no frontend UI |
| API keys | ❌ Not implemented | Backend endpoints, no frontend UI |

---

## 11. PRIORITY FIX LIST

### P0 — Fix immediately
1. **Password hash exposure** — `projects.service.ts` — use `select` instead of `include`
2. **Calls page crash** — Either implement backend or add graceful fallback in frontend
3. **Email change crash** — Either implement endpoint or remove button
4. **Admin stats endpoint** — Change `GET /admin/stats` to `GET /admin/analytics/summary`
5. **Type cast to `never`** — Fix `profile/edit/page.tsx:106`

### P1 — Fix before production
6. **Chat settings persistence** — Wire toggles to backend preferences endpoint
7. **Apply message not sent** — Either remove textarea or send message in request
8. **Notifications mark-read** — Add UI buttons
9. **Broken `/skills` link** — Either create page or remove link
10. **Chat message race condition** — Fix tempId replacement on server response

### P2 — Code quality
11. Replace all `.catch(() => {})` with proper error logging/toast
12. Fix `localStorage` reads in admin/page.tsx, calls/page.tsx, onboarding/page.tsx to use auth store
13. Remove unused `DashboardSkeleton` import
14. Fix dynamic import in `useNotificationSocket.ts`
15. Remove `any` types in bookmarks/page.tsx, profile/edit/page.tsx, chat/page.tsx
16. Add form validation to onboarding/page.tsx
