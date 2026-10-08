-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AGENT', 'AGENCY_ADMIN');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "brandingLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'AGENT';

-- CreateTable
CREATE TABLE "Brokerage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "websiteUrl" TEXT,
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "agentId" TEXT,
    "agencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brokerage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "plan" TEXT,
    "seatLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brokerage_agentId_key" ON "Brokerage"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Brokerage_agencyId_key" ON "Brokerage"("agencyId");

-- CreateIndex
CREATE INDEX "Agent_agencyId_idx" ON "Agent"("agencyId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brokerage" ADD CONSTRAINT "Brokerage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brokerage" ADD CONSTRAINT "Brokerage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
