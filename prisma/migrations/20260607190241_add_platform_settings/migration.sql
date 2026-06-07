-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "restaurant_type" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "registration_mode" TEXT NOT NULL DEFAULT 'request',
    "show_commission" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
