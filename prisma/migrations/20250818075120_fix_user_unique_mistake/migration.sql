/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_userId_key" ON "public"."EventParticipant"("eventId", "userId");
