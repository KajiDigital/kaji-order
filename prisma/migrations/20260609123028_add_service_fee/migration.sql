-- AlterTable
ALTER TABLE "commission_records" ADD COLUMN     "food_commission_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "service_fee_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_platform_pence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "service_fee_pence" INTEGER NOT NULL DEFAULT 49;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "service_fee_pence" INTEGER NOT NULL DEFAULT 49;
