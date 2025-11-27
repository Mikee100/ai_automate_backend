-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "isAiPaused" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
