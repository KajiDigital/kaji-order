-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "stripe_details_submitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "restaurants" ADD COLUMN "stripe_charges_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "restaurants" ADD COLUMN "stripe_payouts_enabled" BOOLEAN NOT NULL DEFAULT false;
