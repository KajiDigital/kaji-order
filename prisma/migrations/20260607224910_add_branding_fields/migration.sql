-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "font_choice" TEXT DEFAULT 'default',
ADD COLUMN     "primary_color" TEXT DEFAULT '#c2410c',
ADD COLUMN     "secondary_color" TEXT DEFAULT '#ffffff',
ADD COLUMN     "show_powered_by" BOOLEAN NOT NULL DEFAULT true;
