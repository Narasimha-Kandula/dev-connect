-- Add performance indexes
CREATE INDEX IF NOT EXISTS "blocked_users_blocked_id_blocker_id_idx" ON "blocked_users"("blocked_id", "blocker_id");
CREATE INDEX IF NOT EXISTS "conversation_members_conversation_id_idx" ON "conversation_members"("conversation_id");
CREATE INDEX IF NOT EXISTS "matches_status_idx" ON "matches"("status");
CREATE INDEX IF NOT EXISTS "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");
CREATE INDEX IF NOT EXISTS "project_members_project_id_idx" ON "project_members"("project_id");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks"("assignee_id");
