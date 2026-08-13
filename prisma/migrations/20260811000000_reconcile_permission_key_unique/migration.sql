-- This unique index already exists in the target database.
-- The migration is resolved as applied to reconcile migration history.
CREATE UNIQUE INDEX "Permission_permission_key_key" ON "Permission"("permission_key");
