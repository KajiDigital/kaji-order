-- CreateTable
CREATE TABLE "attribute_sets" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group_type" TEXT NOT NULL DEFAULT 'SINGLE',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" INTEGER NOT NULL DEFAULT 0,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_choices" (
    "id" TEXT NOT NULL,
    "attribute_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_delta_pence" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_attribute_sets" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "attribute_set_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_attribute_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attribute_sets_restaurant_id_sort_order_idx" ON "attribute_sets"("restaurant_id", "sort_order");

-- CreateIndex
CREATE INDEX "attribute_choices_attribute_set_id_sort_order_idx" ON "attribute_choices"("attribute_set_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_item_attribute_sets_menu_item_id_sort_order_idx" ON "menu_item_attribute_sets"("menu_item_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_item_attribute_sets_attribute_set_id_idx" ON "menu_item_attribute_sets"("attribute_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_attribute_sets_menu_item_id_attribute_set_id_key" ON "menu_item_attribute_sets"("menu_item_id", "attribute_set_id");

-- AddForeignKey
ALTER TABLE "attribute_sets" ADD CONSTRAINT "attribute_sets_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_choices" ADD CONSTRAINT "attribute_choices_attribute_set_id_fkey" FOREIGN KEY ("attribute_set_id") REFERENCES "attribute_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_attribute_sets" ADD CONSTRAINT "menu_item_attribute_sets_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_attribute_sets" ADD CONSTRAINT "menu_item_attribute_sets_attribute_set_id_fkey" FOREIGN KEY ("attribute_set_id") REFERENCES "attribute_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
