-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock" "StockStatus" NOT NULL DEFAULT 'IN_STOCK';

-- CreateIndex
CREATE INDEX "idx_product_stock" ON "Product"("stock");
