-- CreateTable
CREATE TABLE "booking_drafts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "service" TEXT,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "name" TEXT,
    "step" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_drafts_customerId_key" ON "booking_drafts"("customerId");

-- AddForeignKey
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
