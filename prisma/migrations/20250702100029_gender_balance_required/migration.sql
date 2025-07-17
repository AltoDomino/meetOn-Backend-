/*
  Warnings:

  - Made the column `genderBalance` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "genderBalance" SET NOT NULL,
ALTER COLUMN "genderBalance" SET DEFAULT false;
