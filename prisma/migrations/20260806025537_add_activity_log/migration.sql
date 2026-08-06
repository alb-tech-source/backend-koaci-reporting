-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'USER_RESET_PASSWORD', 'INVESTOR_CREATE', 'INVESTOR_UPDATE', 'INVESTOR_DELETE', 'INVESTOR_STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ROLE_CHANGE');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("activity_id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_user_id_idx" ON "ActivityLog"("user_id");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_type_entity_id_idx" ON "ActivityLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
