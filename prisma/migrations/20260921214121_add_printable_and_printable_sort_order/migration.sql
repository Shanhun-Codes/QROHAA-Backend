-- AlterTable
ALTER TABLE "AgentFeedbackQuestion" ADD COLUMN     "printable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printableSortOrder" INTEGER;

-- AlterTable
ALTER TABLE "OpenHouseFeedbackQuestion" ADD COLUMN     "printable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printableSortOrder" INTEGER;
