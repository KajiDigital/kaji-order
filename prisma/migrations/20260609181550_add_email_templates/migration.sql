-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "template_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_templates_template_type_idx" ON "email_templates"("template_type");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_restaurant_id_template_type_key" ON "email_templates"("restaurant_id", "template_type");

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
