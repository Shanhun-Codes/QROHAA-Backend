-- CreateEnum
CREATE TYPE "PropertyStatusType" AS ENUM ('ACTIVE', 'ARCHIVED');

-- DropIndex
DROP INDEX "Note_agentId_idx";

-- DropIndex
DROP INDEX "Note_subjectType_subjectId_idx";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "status" "PropertyStatusType" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Lead_agentId_status_idx" ON "Lead"("agentId", "status");

-- CreateIndex
CREATE INDEX "Lead_agentId_createdAt_idx" ON "Lead"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_agentId_subjectType_subjectId_idx" ON "Note"("agentId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "OpenHouse_agentId_startsAt_idx" ON "OpenHouse"("agentId", "startsAt");

-- CreateIndex
CREATE INDEX "OpenHouse_agentId_endsAt_idx" ON "OpenHouse"("agentId", "endsAt");

-- CreateIndex
CREATE INDEX "Property_agentId_status_idx" ON "Property"("agentId", "status");
