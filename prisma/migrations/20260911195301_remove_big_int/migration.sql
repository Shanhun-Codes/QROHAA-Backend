/*
  Warnings:

  - You are about to alter the column `listingPriceCents` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "listingPriceCents" SET DATA TYPE INTEGER;
