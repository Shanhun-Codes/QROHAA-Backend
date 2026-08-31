-- CreateEnum
CREATE TYPE "FeedbackQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'BOOLEAN', 'RATING', 'SINGLE_SELECT', 'MULTI_SELECT');

-- CreateTable
CREATE TABLE "FeedbackQuestion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FeedbackQuestionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackQuestionOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "FeedbackQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentFeedbackQuestion" (
    "agentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "AgentFeedbackQuestion_pkey" PRIMARY KEY ("agentId","questionId")
);

-- CreateTable
CREATE TABLE "OpenHouseFeedbackQuestion" (
    "openHouseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "OpenHouseFeedbackQuestion_pkey" PRIMARY KEY ("openHouseId","questionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackQuestion_key_key" ON "FeedbackQuestion"("key");

-- AddForeignKey
ALTER TABLE "FeedbackQuestionOption" ADD CONSTRAINT "FeedbackQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FeedbackQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFeedbackQuestion" ADD CONSTRAINT "AgentFeedbackQuestion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFeedbackQuestion" ADD CONSTRAINT "AgentFeedbackQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FeedbackQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenHouseFeedbackQuestion" ADD CONSTRAINT "OpenHouseFeedbackQuestion_openHouseId_fkey" FOREIGN KEY ("openHouseId") REFERENCES "OpenHouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenHouseFeedbackQuestion" ADD CONSTRAINT "OpenHouseFeedbackQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FeedbackQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
