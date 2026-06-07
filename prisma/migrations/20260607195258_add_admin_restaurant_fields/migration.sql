-- AlterTable
ALTER TABLE "restaurant_staff" ADD COLUMN     "last_login_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3);
