-- ─────────────────────────────────────────────────────────────
-- DevConnect — Database Schema (PostgreSQL / Supabase)
-- Mirrors backend/src/prisma/schema.prisma
-- Run this in the Supabase SQL editor, or via `psql $DIRECT_URL -f schema.sql`
-- Prefer `npm run prisma:migrate` from /backend for day-to-day changes;
-- this file is a reference / manual-bootstrap copy.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────
create type user_role as enum ('DEVELOPER', 'RECRUITER', 'ADMIN', 'MODERATOR');
create type availability_status as enum ('OPEN_TO_WORK', 'HIRING', 'OPEN_TO_COLLAB', 'NOT_AVAILABLE');
create type plan_tier as enum ('FREE', 'PRO', 'ENTERPRISE');
create type swipe_action as enum ('LIKE', 'SUPER_LIKE', 'PASS');
create type match_status as enum ('ACTIVE', 'ARCHIVED', 'BLOCKED');
create type invitation_status as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
create type project_member_role as enum ('OWNER', 'CONTRIBUTOR', 'VIEWER');
create type project_status as enum ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
create type notification_type as enum ('MATCH', 'MESSAGE', 'INVITATION', 'PROJECT', 'SYSTEM');
create type notification_channel as enum ('IN_APP', 'EMAIL', 'PUSH');

-- ─── Auth & Identity ────────────────────────────────────────
create table users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  password_hash     text,
  email_verified    boolean not null default false,
  role              user_role not null default 'DEVELOPER',
  plan_tier         plan_tier not null default 'FREE',
  is_suspended      boolean not null default false,
  is_banned         boolean not null default false,
  last_login_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table oauth_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  provider      text not null,
  provider_id   text not null,
  access_token  text,
  created_at    timestamptz not null default now(),
  unique (provider, provider_id)
);

create table sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  refresh_token  text unique not null,
  user_agent     text,
  ip_address     text,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),
  revoked_at     timestamptz
);

create table api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  name          text not null,
  key_hash      text unique not null,
  last_used_at  timestamptz,
  revoked       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── Profile & Skills ───────────────────────────────────────
create table profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid unique not null references users(id) on delete cascade,
  display_name          text not null,
  headline              text,
  bio                   text,
  avatar_url            text,
  location              text,
  github_username       text,
  github_data           jsonb,
  portfolio_links       jsonb,
  availability          availability_status not null default 'NOT_AVAILABLE',
  reputation_score      integer not null default 0,
  profile_completeness  integer not null default 0,
  is_public             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table skills (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  category    text,
  created_at  timestamptz not null default now()
);

create table profile_skills (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  skill_id      uuid not null references skills(id) on delete cascade,
  proficiency   integer not null default 1,
  is_verified   boolean not null default false,
  unique (profile_id, skill_id)
);

create table endorsements (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  endorser_id   uuid not null,
  message       text,
  created_at    timestamptz not null default now(),
  unique (profile_id, endorser_id)
);

-- ─── Discovery / Swipe / Matching ───────────────────────────
create table swipes (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid not null references users(id) on delete cascade,
  target_id   uuid not null references users(id) on delete cascade,
  action      swipe_action not null,
  created_at  timestamptz not null default now(),
  unique (source_id, target_id)
);
create index idx_swipes_target on swipes(target_id);

create table matches (
  id            uuid primary key default gen_random_uuid(),
  user_one_id   uuid not null references users(id) on delete cascade,
  user_two_id   uuid not null references users(id) on delete cascade,
  status        match_status not null default 'ACTIVE',
  match_score   double precision,
  created_at    timestamptz not null default now(),
  unique (user_one_id, user_two_id)
);

create table connections (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null references users(id) on delete cascade,
  user_b_id   uuid not null references users(id) on delete cascade,
  tag         text,
  created_at  timestamptz not null default now(),
  unique (user_a_id, user_b_id)
);

create table invitations (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references users(id) on delete cascade,
  receiver_id   uuid not null references users(id) on delete cascade,
  project_id    uuid,
  message       text,
  status        invitation_status not null default 'PENDING',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);

create table blocked_users (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- ─── Messaging ──────────────────────────────────────────────
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid unique references matches(id) on delete cascade,
  project_id  uuid,
  is_group    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table conversation_members (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  last_read_at     timestamptz,
  is_muted         boolean not null default false,
  joined_at        timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references users(id) on delete cascade,
  content          text,
  attachments       jsonb,
  edited_at        timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);
create index idx_messages_conversation_created on messages(conversation_id, created_at);

create table message_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages(id) on delete cascade,
  user_id     uuid not null,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

-- ─── Projects & Collaboration ───────────────────────────────
create table projects (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references users(id) on delete cascade,
  title            text not null,
  description      text,
  required_skills  jsonb,
  budget           text,
  timeline         text,
  status           project_status not null default 'DRAFT',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table invitations add constraint fk_invitations_project
  foreign key (project_id) references projects(id) on delete cascade;
alter table conversations add constraint fk_conversations_project
  foreign key (project_id) references projects(id) on delete cascade;

create table project_members (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         project_member_role not null default 'CONTRIBUTOR',
  joined_at    timestamptz not null default now(),
  unique (project_id, user_id)
);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'todo',
  assignee_id  uuid,
  due_date     timestamptz,
  created_at   timestamptz not null default now()
);

create table shared_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  uploader_id  uuid not null references users(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_type    text,
  size_bytes   integer,
  created_at   timestamptz not null default now()
);

-- ─── Notifications ──────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null,
  channel     notification_channel not null default 'IN_APP',
  title       text not null,
  body        text,
  metadata    jsonb,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user_read on notifications(user_id, is_read);

-- ─── Moderation / Admin / Audit ─────────────────────────────
create table reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references users(id) on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  reason        text not null,
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

create table moderation_actions (
  id            uuid primary key default gen_random_uuid(),
  moderator_id  uuid not null references users(id) on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  action        text not null,
  reason        text,
  created_at    timestamptz not null default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,
  action      text not null,
  entity      text,
  entity_id   uuid,
  metadata    jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

-- ─── Row Level Security (Supabase) ───────────────────────────
-- Enable RLS and lock tables down by default; the NestJS backend
-- connects with the service-role key which bypasses RLS. If you
-- ever query these tables directly from the browser via the
-- Supabase client, add explicit policies per table below.
alter table users enable row level security;
alter table profiles enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (is_public = true);
