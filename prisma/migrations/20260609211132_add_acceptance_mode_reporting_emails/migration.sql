-- AlterTable
ALTER TABLE "online_order_items" ADD COLUMN     "modifiers_text" TEXT,
ADD COLUMN     "pos_item_id" TEXT;

-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "accept_by" TIMESTAMP(3),
ADD COLUMN     "day_of_week" INTEGER,
ADD COLUMN     "estimated_time" TEXT,
ADD COLUMN     "hour_of_day" INTEGER,
ADD COLUMN     "month_number" INTEGER,
ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'CARD',
ADD COLUMN     "pos_order_id" TEXT,
ADD COLUMN     "prep_time_mins" INTEGER,
ADD COLUMN     "ready_at" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'online',
ADD COLUMN     "week_number" INTEGER;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "acceptance_timer_mins" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "order_mode" TEXT NOT NULL DEFAULT 'instant';
