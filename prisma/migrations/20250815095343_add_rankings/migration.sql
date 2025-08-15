-- DropForeignKey
ALTER TABLE "public"."EventParticipant" DROP CONSTRAINT "EventParticipant_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EventParticipant" DROP CONSTRAINT "EventParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserInterest" DROP CONSTRAINT "UserInterest_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "locationKey" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "rankCompletedEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rankUniqueLocations" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."EventCompletion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "locationKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLocationVisit" (
    "userId" INTEGER NOT NULL,
    "locationKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocationVisit_pkey" PRIMARY KEY ("userId","locationKey")
);

-- CreateIndex
CREATE INDEX "EventCompletion_userId_idx" ON "public"."EventCompletion"("userId");

-- CreateIndex
CREATE INDEX "EventCompletion_eventId_idx" ON "public"."EventCompletion"("eventId");

-- CreateIndex
CREATE INDEX "EventCompletion_locationKey_idx" ON "public"."EventCompletion"("locationKey");

-- CreateIndex
CREATE UNIQUE INDEX "EventCompletion_userId_eventId_key" ON "public"."EventCompletion"("userId", "eventId");

-- CreateIndex
CREATE INDEX "UserLocationVisit_userId_idx" ON "public"."UserLocationVisit"("userId");

-- CreateIndex
CREATE INDEX "UserLocationVisit_locationKey_idx" ON "public"."UserLocationVisit"("locationKey");

-- CreateIndex
CREATE INDEX "Event_locationId_idx" ON "public"."Event"("locationId");

-- CreateIndex
CREATE INDEX "Event_locationKey_idx" ON "public"."Event"("locationKey");

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventCompletion" ADD CONSTRAINT "EventCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventCompletion" ADD CONSTRAINT "EventCompletion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLocationVisit" ADD CONSTRAINT "UserLocationVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
