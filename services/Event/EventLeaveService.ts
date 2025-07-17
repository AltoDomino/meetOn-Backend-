import { PrismaClient } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

export const leaveEvent = async (userId: number, eventId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userName: true },
  });

  if (!user) throw new Error("Użytkownik nie istnieje.");

  const participation = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (!participation) {
    throw new Error("Użytkownik nie jest zapisany na to wydarzenie.");
  }

  await prisma.eventParticipant.delete({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { userName: true } },
    },
  });

  if (!event) throw new Error("Wydarzenie nie istnieje.");

  const joinedCount = await prisma.eventParticipant.count({
    where: { eventId },
  });

  const interests = await prisma.userInterest.findMany({
    where: {
      activity: event.activity,
      userId: { not: userId },
    },
  });

  const userIds = interests.map((i) => i.userId);

  const tokens = await prisma.pushToken.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  const fullAddress = event.address || event.location || "nieznana lokalizacja";

  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      sound: "default",
      title: `🚪 ${user.userName} opuścił/a wydarzenie: ${event.activity}`,
      body: `📍 ${fullAddress}\nUczestników: ${joinedCount} / ${event.maxParticipants}`,
      data: {
        eventId: event.id,
        activity: event.activity,
      },
    }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }

  return { message: "Użytkownik opuścił wydarzenie." };
};
