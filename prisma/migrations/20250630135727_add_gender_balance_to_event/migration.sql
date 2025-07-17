/*
  Warnings:

  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "genderBalance" BOOLEAN;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "gender";
