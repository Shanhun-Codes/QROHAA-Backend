-- CreateEnum
CREATE TYPE "FeedbackQuestionCategory" AS ENUM ('BUYER_PROFILE', 'PROPERTY_FEEDBACK', 'BUYING_READINESS', 'GENERAL');

-- AlterTable
ALTER TABLE "FeedbackQuestion" ADD COLUMN     "category" "FeedbackQuestionCategory" NOT NULL DEFAULT 'GENERAL';
