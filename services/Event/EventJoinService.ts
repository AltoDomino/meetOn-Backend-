import { PrismaClient } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

export const joinEvent = async (userId: number, eventId: number) => {
  // 1. Czy już dołączony?
  const alreadyJoined = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (alreadyJoined) {
    throw new Error("Użytkownik już dołączył do wydarzenia.");
  }

  // 2. Pobierz wydarzenie z uczestnikami i twórcą
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { userName: true } },
      eventParticipants: { include: { user: true } },
    },
  });

  if (!event) {
    throw new Error("Nie znaleziono wydarzenia.");
  }

  const participants = event.eventParticipants;
  const totalSpots = event.maxParticipants;
  const currentCount = participants.length;

  if (currentCount >= totalSpots) {
    throw new Error("Brak miejsc w wydarzeniu.");
  }

  // 3. Sprawdzenie płci
  const joiningUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true },
  });

  if (!joiningUser || !joiningUser.gender) {
    throw new Error("Brak informacji o płci użytkownika.");
  }

  if (event.genderBalance) {
    const males = participants.filter(
      (p) => p.user?.gender === "male"
    ).length;
    const females = participants.filter(
      (p) => p.user?.gender === "female"
    ).length;

    const half = Math.floor(totalSpots / 2);
    const isOdd = totalSpots % 2 === 1;
    const allJoined = males + females;

    if (joiningUser.gender === "male") {
      if (males >= half && !(isOdd && allJoined === totalSpots - 1)) {
        throw new Error("Limit miejsc dla mężczyzn został osiągnięty.");
      }
    }

    if (joiningUser.gender === "female") {
      if (females >= half && !(isOdd && allJoined === totalSpots - 1)) {
        throw new Error("Limit miejsc dla kobiet został osiągnięty.");
      }
    }
  }

  // 4. Zapisanie uczestnika
  await prisma.eventParticipant.create({
    data: { userId, eventId },
  });

  // 5. Liczba uczestników po dołączeniu
  const joinedCount = await prisma.eventParticipant.count({
    where: { eventId },
  });

  // 6. Powiadomienie dla zainteresowanych aktywnością
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
      title: `👥 Nowy uczestnik w wydarzeniu: ${event.activity}`,
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

  return { message: "Dołączono do wydarzenia." };
};
