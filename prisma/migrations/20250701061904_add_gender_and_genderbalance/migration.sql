/*
  Warnings:

  - You are about to drop the column `gender` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "gender";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT;
