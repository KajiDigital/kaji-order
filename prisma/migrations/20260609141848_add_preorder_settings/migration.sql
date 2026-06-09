-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "is_preorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preorder_for" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "accept_preorders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preorder_days_ahead" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "show_menu_when_closed" BOOLEAN NOT NULL DEFAULT true;
