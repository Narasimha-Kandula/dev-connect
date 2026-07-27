-- CreateIndex
CREATE INDEX "blocked_users_blocker_id_idx" ON "blocked_users"("blocker_id");

-- CreateIndex
CREATE INDEX "blocked_users_blocked_id_idx" ON "blocked_users"("blocked_id");

-- CreateIndex
CREATE INDEX "profiles_user_id_is_public_idx" ON "profiles"("user_id", "is_public");

-- CreateIndex
CREATE INDEX "profiles_reputation_score_idx" ON "profiles"("reputation_score");

-- CreateIndex
CREATE INDEX "swipes_source_id_idx" ON "swipes"("source_id");
