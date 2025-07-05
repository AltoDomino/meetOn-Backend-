import { PrismaClient } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

export const joinEvent = async (userId: number, eventId: number) => {
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

  const joiningUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true, age: true },
  });

  if (!joiningUser) {
    throw new Error("Nie znaleziono użytkownika.");
  }

  if (!joiningUser.gender) {
    throw new Error("Brak informacji o płci użytkownika.");
  }

  if (
    event.minAge !== null &&
    event.maxAge !== null &&
    (joiningUser.age === null ||
      joiningUser.age < event.minAge ||
      joiningUser.age > event.maxAge)
  ) {
    throw new Error(
      "Twój wiek nie mieści się w wymaganym zakresie wydarzenia."
    );
  }

  if (event.genderBalance) {
    const males = participants.filter(
      (p: (typeof participants)[number]) => p.user?.gender === "male"
    ).length;

    const females = participants.filter(
      (p: (typeof participants)[number]) => p.user?.gender === "female"
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

  await prisma.eventParticipant.create({
    data: { userId, eventId },
  });

  const joinedCount = await prisma.eventParticipant.count({
    where: { eventId },
  });

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
