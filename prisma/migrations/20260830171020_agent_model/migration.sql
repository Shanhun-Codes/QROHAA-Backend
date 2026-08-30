/*
  Warnings:

  - You are about to drop the column `active` on the `Agent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `Agent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "active",
ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_id_key" ON "Agent"("id");
