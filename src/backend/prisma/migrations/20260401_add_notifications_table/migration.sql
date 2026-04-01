-- CreateTable
CREATE TABLE "vpg_notifications" (
    "notifications_id" SERIAL NOT NULL,
    "notifications_user_id" INTEGER NOT NULL,
    "notifications_title" VARCHAR(100) NOT NULL,
    "notifications_message" VARCHAR(500) NOT NULL,
    "notifications_type" VARCHAR(30) NOT NULL,
    "notifications_is_read" BOOLEAN NOT NULL DEFAULT false,
    "notifications_created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifications_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vpg_notifications_pkey" PRIMARY KEY ("notifications_id")
);

-- CreateIndex
CREATE INDEX "idx_vpg_notifications_user_id" ON "vpg_notifications"("notifications_user_id");

-- CreateIndex
CREATE INDEX "idx_vpg_notifications_is_read" ON "vpg_notifications"("notifications_is_read");

-- CreateIndex
CREATE INDEX "idx_vpg_notifications_created_at" ON "vpg_notifications"("notifications_created_at");

-- AddForeignKey
ALTER TABLE "vpg_notifications" ADD CONSTRAINT "fk_vpg_notifications_users_24" FOREIGN KEY ("notifications_user_id") REFERENCES "vpg_users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
