-- CreateEnum
CREATE TYPE "MenuSource" AS ENUM ('manual', 'kaji_sync');

-- CreateEnum
CREATE TYPE "PricingPlan" AS ENUM ('COMMISSION', 'MONTHLY', 'WEEKLY', 'BUNDLE');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('COLLECTION', 'DELIVERY');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PostcodeRuleType" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "phone" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "description" TEXT,
    "brand_color" TEXT NOT NULL DEFAULT '#2563eb',
    "menu_source" "MenuSource" NOT NULL DEFAULT 'manual',
    "kaji_cloud_id" TEXT,
    "pricing_plan" "PricingPlan" NOT NULL DEFAULT 'COMMISSION',
    "commission_pct" INTEGER NOT NULL DEFAULT 5,
    "stripe_account_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "holiday_mode" BOOLEAN NOT NULL DEFAULT false,
    "holiday_message" TEXT,
    "opening_hours" JSONB,
    "auto_accept_orders" BOOLEAN NOT NULL DEFAULT false,
    "accept_timeout_minutes" INTEGER NOT NULL DEFAULT 10,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_staff" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "invite_token" TEXT,
    "password_set" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_from" TEXT,
    "available_until" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_pence" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "min_select" INTEGER NOT NULL DEFAULT 0,
    "max_select" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" TEXT NOT NULL,
    "modifier_group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta_pence" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_orders" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "order_type" "OrderType" NOT NULL DEFAULT 'COLLECTION',
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "notes" TEXT,
    "subtotal_pence" INTEGER NOT NULL,
    "delivery_fee_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "commission_pct" INTEGER NOT NULL,
    "commission_pence" INTEGER NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "estimated_ready_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "delivery_address" TEXT,
    "delivery_postcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "name" TEXT NOT NULL,
    "price_pence" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "modifiers_json" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "online_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "order_id" TEXT,
    "period_month" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_revenue_pence" INTEGER NOT NULL DEFAULT 0,
    "commission_pence" INTEGER NOT NULL DEFAULT 0,
    "stripe_invoice_id" TEXT,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "radius_km" DOUBLE PRECISION NOT NULL,
    "delivery_fee_pence" INTEGER NOT NULL DEFAULT 0,
    "minimum_order_pence" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcode_rules" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "delivery_zone_id" TEXT,
    "rule_type" "PostcodeRuleType" NOT NULL,
    "postcode_prefix" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postcode_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_kaji_cloud_id_key" ON "restaurants"("kaji_cloud_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_staff_email_key" ON "restaurant_staff"("email");

-- CreateIndex
CREATE INDEX "restaurant_staff_restaurant_id_idx" ON "restaurant_staff"("restaurant_id");

-- CreateIndex
CREATE INDEX "menu_categories_restaurant_id_sort_order_idx" ON "menu_categories"("restaurant_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_items_restaurant_id_category_id_idx" ON "menu_items"("restaurant_id", "category_id");

-- CreateIndex
CREATE INDEX "modifier_groups_menu_item_id_idx" ON "modifier_groups"("menu_item_id");

-- CreateIndex
CREATE INDEX "modifiers_modifier_group_id_idx" ON "modifiers"("modifier_group_id");

-- CreateIndex
CREATE INDEX "online_orders_restaurant_id_status_created_at_idx" ON "online_orders"("restaurant_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "online_orders_restaurant_id_order_number_key" ON "online_orders"("restaurant_id", "order_number");

-- CreateIndex
CREATE INDEX "online_order_items_order_id_idx" ON "online_order_items"("order_id");

-- CreateIndex
CREATE INDEX "commission_records_restaurant_id_period_month_idx" ON "commission_records"("restaurant_id", "period_month");

-- CreateIndex
CREATE INDEX "delivery_zones_restaurant_id_idx" ON "delivery_zones"("restaurant_id");

-- CreateIndex
CREATE INDEX "postcode_rules_restaurant_id_idx" ON "postcode_rules"("restaurant_id");

-- AddForeignKey
ALTER TABLE "restaurant_staff" ADD CONSTRAINT "restaurant_staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_orders" ADD CONSTRAINT "online_orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_order_items" ADD CONSTRAINT "online_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "online_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_order_items" ADD CONSTRAINT "online_order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "online_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcode_rules" ADD CONSTRAINT "postcode_rules_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcode_rules" ADD CONSTRAINT "postcode_rules_delivery_zone_id_fkey" FOREIGN KEY ("delivery_zone_id") REFERENCES "delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
