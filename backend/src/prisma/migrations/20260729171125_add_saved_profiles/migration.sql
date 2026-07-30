-- CreateTable
CREATE TABLE "saved_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saved_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_profiles_user_id_idx" ON "saved_profiles"("user_id");

-- CreateIndex
CREATE INDEX "saved_profiles_saved_user_id_idx" ON "saved_profiles"("saved_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_profiles_user_id_saved_user_id_key" ON "saved_profiles"("user_id", "saved_user_id");

-- AddForeignKey
ALTER TABLE "saved_profiles" ADD CONSTRAINT "saved_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_profiles" ADD CONSTRAINT "saved_profiles_saved_user_id_fkey" FOREIGN KEY ("saved_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
