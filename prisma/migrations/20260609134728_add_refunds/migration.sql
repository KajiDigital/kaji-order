-- AlterEnum
ALTER TYPE "CommissionStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StripePaymentStatus" ADD VALUE 'authorised';
ALTER TYPE "StripePaymentStatus" ADD VALUE 'captured';
ALTER TYPE "StripePaymentStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "refund_amount_pence" INTEGER,
ADD COLUMN     "refund_reason" TEXT;
