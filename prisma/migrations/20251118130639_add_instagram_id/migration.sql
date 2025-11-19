/*
  Warnings:

  - A unique constraint covering the columns `[instagramId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "instagramId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_instagramId_key" ON "customers"("instagramId");
