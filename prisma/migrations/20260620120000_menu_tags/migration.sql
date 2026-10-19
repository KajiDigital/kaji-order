-- CreateTable
CREATE TABLE "menu_tags" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_tags" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_tags_restaurant_id_kind_sort_order_idx" ON "menu_tags"("restaurant_id", "kind", "sort_order");

-- CreateIndex
CREATE INDEX "menu_item_tags_menu_item_id_sort_order_idx" ON "menu_item_tags"("menu_item_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_item_tags_tag_id_idx" ON "menu_item_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_tags_menu_item_id_tag_id_key" ON "menu_item_tags"("menu_item_id", "tag_id");

-- AddForeignKey
ALTER TABLE "menu_tags" ADD CONSTRAINT "menu_tags_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_tags" ADD CONSTRAINT "menu_item_tags_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_tags" ADD CONSTRAINT "menu_item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "menu_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
