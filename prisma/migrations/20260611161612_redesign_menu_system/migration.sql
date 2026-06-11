-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "allergens" JSONB,
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_gluten_free" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricing_type" TEXT NOT NULL DEFAULT 'OPTIONS',
ADD COLUMN     "spice_level" INTEGER;

-- AlterTable
ALTER TABLE "online_order_items" ADD COLUMN     "options_price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "option_groups" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group_type" TEXT NOT NULL DEFAULT 'SINGLE',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_delta_pence" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "linked_item_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "calories" INTEGER,
    "allergens" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_groups" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "min_items" INTEGER NOT NULL DEFAULT 1,
    "max_items" INTEGER NOT NULL DEFAULT 1,
    "source_type" TEXT NOT NULL DEFAULT 'ITEMS',
    "source_category_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_options" (
    "id" TEXT NOT NULL,
    "combo_group_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "price_override" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "option_groups_item_id_idx" ON "option_groups"("item_id");

-- CreateIndex
CREATE INDEX "options_group_id_idx" ON "options"("group_id");

-- CreateIndex
CREATE INDEX "combo_groups_item_id_idx" ON "combo_groups"("item_id");

-- CreateIndex
CREATE INDEX "combo_options_combo_group_id_idx" ON "combo_options"("combo_group_id");

-- CreateIndex
CREATE INDEX "combo_options_menu_item_id_idx" ON "combo_options"("menu_item_id");

-- AddForeignKey
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_linked_item_id_fkey" FOREIGN KEY ("linked_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_groups" ADD CONSTRAINT "combo_groups_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_options" ADD CONSTRAINT "combo_options_combo_group_id_fkey" FOREIGN KEY ("combo_group_id") REFERENCES "combo_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_options" ADD CONSTRAINT "combo_options_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
