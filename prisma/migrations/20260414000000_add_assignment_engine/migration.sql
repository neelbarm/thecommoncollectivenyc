-- CreateEnum
CREATE TYPE "AssignmentRunStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AssignmentMemberDecision" AS ENUM ('PROPOSED', 'LOCKED', 'MOVED', 'REMOVED');

-- CreateTable
CREATE TABLE "AssignmentRun" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "status" "AssignmentRunStatus" NOT NULL DEFAULT 'DRAFT',
    "configJson" JSONB NOT NULL,
    "scoreSnapshot" JSONB,
    "errorMessage" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentProposal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "rationaleJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentMember" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" "AssignmentMemberDecision" NOT NULL DEFAULT 'PROPOSED',
    "signalBreakdown" JSONB,

    CONSTRAINT "AssignmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentRun_seasonId_status_idx" ON "AssignmentRun"("seasonId", "status");

-- CreateIndex
CREATE INDEX "AssignmentRun_createdAt_idx" ON "AssignmentRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentProposal_runId_cohortId_key" ON "AssignmentProposal"("runId", "cohortId");

-- CreateIndex
CREATE INDEX "AssignmentProposal_cohortId_idx" ON "AssignmentProposal"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentMember_proposalId_userId_key" ON "AssignmentMember"("proposalId", "userId");

-- CreateIndex
CREATE INDEX "AssignmentMember_userId_idx" ON "AssignmentMember"("userId");

-- AddForeignKey
ALTER TABLE "AssignmentRun" ADD CONSTRAINT "AssignmentRun_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRun" ADD CONSTRAINT "AssignmentRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRun" ADD CONSTRAINT "AssignmentRun_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentProposal" ADD CONSTRAINT "AssignmentProposal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AssignmentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentProposal" ADD CONSTRAINT "AssignmentProposal_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentMember" ADD CONSTRAINT "AssignmentMember_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AssignmentProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentMember" ADD CONSTRAINT "AssignmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
