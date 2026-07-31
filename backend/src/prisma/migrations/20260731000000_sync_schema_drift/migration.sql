-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "user_devices" DROP COLUMN "push_token",
ADD COLUMN     "device_name" TEXT,
ADD COLUMN     "device_token" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_active_at" TIMESTAMP(3),
ALTER COLUMN "platform" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_delete_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "swipe_limits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "swipe_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swipe_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "signals" JSONB,
    "flags" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "swipe_limits_user_id_date_idx" ON "swipe_limits"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "swipe_limits_user_id_date_key" ON "swipe_limits"("user_id", "date");

-- CreateIndex
CREATE INDEX "fraud_flags_user_id_idx" ON "fraud_flags"("user_id");

-- CreateIndex
CREATE INDEX "fraud_flags_risk_score_idx" ON "fraud_flags"("risk_score");

-- CreateIndex
CREATE INDEX "fraud_flags_is_active_idx" ON "fraud_flags"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_flags_user_id_key" ON "fraud_flags"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "collab_room_participants_room_id_left_at_idx" ON "collab_room_participants"("room_id", "left_at");

-- CreateIndex
CREATE UNIQUE INDEX "collab_room_participants_room_id_user_id_key" ON "collab_room_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "collab_rooms_project_id_idx" ON "collab_rooms"("project_id");

-- CreateIndex
CREATE INDEX "collab_rooms_match_id_idx" ON "collab_rooms"("match_id");

-- CreateIndex
CREATE INDEX "invitations_sender_id_status_idx" ON "invitations"("sender_id", "status");

-- CreateIndex
CREATE INDEX "invitations_receiver_id_status_idx" ON "invitations"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");

-- CreateIndex
CREATE INDEX "moderation_actions_target_type_target_id_idx" ON "moderation_actions"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_device_token_idx" ON "user_devices"("device_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_token_platform_key" ON "user_devices"("user_id", "device_token", "platform");

-- AddForeignKey
ALTER TABLE "collab_room_participants" ADD CONSTRAINT "collab_room_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipe_limits" ADD CONSTRAINT "swipe_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

