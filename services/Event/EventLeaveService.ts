import { PrismaClient } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

export const leaveEvent = async (userId: number, eventId: number) => {
  // 1. Sprawdź, czy użytkownik był zapisany
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

  // 2. Usuń uczestnika
  await prisma.eventParticipant.delete({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  // 3. Pobierz wydarzenie + twórcę
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { userName: true } },
    },
  });

  if (!event) throw new Error("Wydarzenie nie istnieje.");

  // 4. Oblicz liczbę uczestników (bez twórcy)
  const joinedCount = await prisma.eventParticipant.count({
    where: { eventId },
  });

  // 5. Znajdź zainteresowanych daną aktywnością (bez opuszczającego)
  const interests = await prisma.userInterest.findMany({
    where: {
      activity: event.activity,
      userId: { not: userId },
    },
  });

  const userIds = interests.map((i: { userId: any; }) => i.userId);

  const tokens = await prisma.pushToken.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  const fullAddress = event.address || event.location || "nieznana lokalizacja";

  const messages = tokens
    .filter((t: { token: unknown; }) => Expo.isExpoPushToken(t.token))
    .map((t: { token: any; }) => ({
      to: t.token,
      sound: "default",
      title: `🚪 Ktoś opuścił wydarzenie: ${event.activity}`,
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
