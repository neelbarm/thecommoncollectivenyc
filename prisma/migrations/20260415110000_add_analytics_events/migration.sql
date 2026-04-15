-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM (
  'signup_started',
  'signup_completed',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
  'cohort_assigned',
  'event_published',
  'event_rsvped',
  'drop_posted'
);

-- CreateEnum
CREATE TYPE "AnalyticsEventSource" AS ENUM (
  'SERVER',
  'CLIENT'
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "name" "AnalyticsEventName" NOT NULL,
  "source" "AnalyticsEventSource" NOT NULL,
  "actorUserId" TEXT,
  "anonymousId" TEXT,
  "path" TEXT,
  "metadata" JSONB,
  "dedupeKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key" ON "AnalyticsEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_actorUserId_createdAt_idx" ON "AnalyticsEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
