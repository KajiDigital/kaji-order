-- AlterTable
ALTER TABLE "online_orders" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "discount_total" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promo_type" TEXT NOT NULL,
    "discount_pct" DOUBLE PRECISION,
    "discount_pence" INTEGER,
    "bundle_price" INTEGER,
    "buy_quantity" INTEGER,
    "get_quantity" INTEGER,
    "applies_to" TEXT NOT NULL DEFAULT 'order',
    "applicable_ids" JSONB,
    "min_order_pence" INTEGER,
    "max_uses" INTEGER,
    "max_uses_per_customer" INTEGER,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "days_of_week" JSONB,
    "time_from" TEXT,
    "time_until" TEXT,
    "badge_text" TEXT,
    "badge_color" TEXT,
    "show_on_menu" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_codes" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discounts" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "promotion_id" TEXT,
    "coupon_code" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_pence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_restaurant_id_active_idx" ON "promotions"("restaurant_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_codes_restaurant_id_code_key" ON "coupon_codes"("restaurant_id", "code");

-- CreateIndex
CREATE INDEX "order_discounts_order_id_idx" ON "order_discounts"("order_id");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_codes" ADD CONSTRAINT "coupon_codes_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "online_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
