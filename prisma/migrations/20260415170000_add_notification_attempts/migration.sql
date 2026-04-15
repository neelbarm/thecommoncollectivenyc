-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "id" TEXT NOT NULL,
    "outboxId" TEXT,
    "type" "EmailOutboxType" NOT NULL,
    "status" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "triggerSource" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAttempt_status_createdAt_idx" ON "NotificationAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationAttempt_type_createdAt_idx" ON "NotificationAttempt"("type", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationAttempt_outboxId_createdAt_idx" ON "NotificationAttempt"("outboxId", "createdAt");

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_outboxId_fkey" FOREIGN KEY ("outboxId") REFERENCES "EmailOutbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;
