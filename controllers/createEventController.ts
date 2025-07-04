import { Request, Response } from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const expo = new Expo();

export const createEventController = async (req: Request, res: Response) => {
  const { location, address, startDate, endDate, activity, creatorId, spots } =
    req.body;

  try {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const now = new Date();

    // Walidacja dat
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowy format daty." });
    }

    if (parsedStart <= now) {
      return res
        .status(400)
        .json({ error: "Data rozpoczęcia musi być w przyszłości." });
    }

    if (parsedEnd <= parsedStart) {
      return res
        .status(400)
        .json({ error: "Data zakończenia musi być po rozpoczęciu." });
    }

    // Tworzenie wydarzenia
    const event = await prisma.event.create({
      data: {
        location,
        address,
        startDate: parsedStart,
        endDate: parsedEnd,
        activity,
        creatorId: Number(creatorId),
        maxParticipants: Number(spots),
        genderBalance: req.body.genderSplit ?? false,
      },
    });

    // Pobranie danych twórcy wydarzenia
    const creator = await prisma.user.findUnique({
      where: { id: Number(creatorId) },
      select: { userName: true },
    });

    const userName = creator?.userName ?? "Użytkownik";

    // Liczba uczestników (bez twórcy)
    const joinedCount = await prisma.eventParticipant.count({
      where: { eventId: event.id },
    });

    // Znalezienie użytkowników zainteresowanych tą aktywnością (bez twórcy)
    const interests = await prisma.userInterest.findMany({
      where: {
        activity,
        userId: { not: creatorId },
      },
    });

    const userIds = interests.map((i) => i.userId);

    const tokens = await prisma.pushToken.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    const fullAddress = address || location || "nieokreślona lokalizacja";

    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: "default",
        title: `${userName} zaprasza na ${activity}!`,
        body: `📍 ${fullAddress}\n👥 Uczestnicy: ${joinedCount} / ${spots}`,
        data: {
          activity,
          location,
          address,
          maxParticipants: spots,
          creatorName: userName,
        },
      }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    await Promise.all(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            message: `${userName} stworzył wydarzenie: ${activity}`,
          },
        })
      )
    );

    res.status(201).json(event);
  } catch (err) {
    console.error("❌ Błąd tworzenia wydarzenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
