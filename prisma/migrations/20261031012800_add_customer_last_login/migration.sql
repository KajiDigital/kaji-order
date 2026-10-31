-- AlterTable
ALTER TABLE "customers" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "customers_last_login_at_idx" ON "customers"("last_login_at");

-- Existing accounts already signed in at least once (register or login).
UPDATE "customers"
SET "last_login_at" = "updated_at"
WHERE "deleted_at" IS NULL AND "last_login_at" IS NULL;
