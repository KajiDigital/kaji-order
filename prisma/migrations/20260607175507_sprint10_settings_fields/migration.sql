-- CreateEnum
CREATE TYPE "StripePaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "stripe_payment_status" "StripePaymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "auto_accept_delay_minutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "avg_prep_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "collection_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "min_order_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sound_alerts" BOOLEAN NOT NULL DEFAULT true;
