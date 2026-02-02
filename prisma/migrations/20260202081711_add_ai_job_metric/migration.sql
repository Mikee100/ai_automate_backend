-- CreateTable
CREATE TABLE "ai_job_metrics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "platform" TEXT,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "strategyUsed" TEXT,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "circuitBreakerTrip" BOOLEAN NOT NULL DEFAULT false,
    "circuitBreakerReason" TEXT,
    "queueWaitingCount" INTEGER,

    CONSTRAINT "ai_job_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_job_metrics_createdAt_idx" ON "ai_job_metrics"("createdAt");

-- CreateIndex
CREATE INDEX "ai_job_metrics_success_idx" ON "ai_job_metrics"("success");

-- CreateIndex
CREATE INDEX "ai_job_metrics_strategyUsed_idx" ON "ai_job_metrics"("strategyUsed");
