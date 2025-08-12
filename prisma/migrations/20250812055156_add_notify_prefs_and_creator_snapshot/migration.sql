-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "creatorLatAtCreate" DOUBLE PRECISION,
ADD COLUMN     "creatorLngAtCreate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "customNotifyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customNotifyLat" DOUBLE PRECISION,
ADD COLUMN     "customNotifyLng" DOUBLE PRECISION,
ADD COLUMN     "lastDeviceLat" DOUBLE PRECISION,
ADD COLUMN     "lastDeviceLng" DOUBLE PRECISION,
ADD COLUMN     "notificationRadiusKm" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "Event_latitude_longitude_idx" ON "public"."Event"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Event_creatorLatAtCreate_creatorLngAtCreate_idx" ON "public"."Event"("creatorLatAtCreate", "creatorLngAtCreate");

-- CreateIndex
CREATE INDEX "EventParticipant_userId_idx" ON "public"."EventParticipant"("userId");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "public"."EventParticipant"("eventId");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_idx" ON "public"."Friendship"("requesterId");

-- CreateIndex
CREATE INDEX "Friendship_recipientId_idx" ON "public"."Friendship"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "User_customNotifyLat_customNotifyLng_idx" ON "public"."User"("customNotifyLat", "customNotifyLng");

-- CreateIndex
CREATE INDEX "User_lastDeviceLat_lastDeviceLng_idx" ON "public"."User"("lastDeviceLat", "lastDeviceLng");

-- CreateIndex
CREATE INDEX "UserInterest_userId_idx" ON "public"."UserInterest"("userId");
