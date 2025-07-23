import { Request, Response } from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const expo = new Expo();

export const createEventController = async (req: Request, res: Response) => {
  const {
    location,
    address,
    startDate,
    endDate,
    activity,
    creatorId,
    spots,
    genderSplit,
    minAge,
    maxAge,
    latitude,  // Nowy parametr
    longitude, // Nowy parametr
  } = req.body;

  try {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const now = new Date();

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowy format daty." });
    }

    if (parsedStart <= now) {
      return res.status(400).json({ error: "Data rozpoczęcia musi być w przyszłości." });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: "Data zakończenia musi być po rozpoczęciu." });
    }

    // Tworzenie wydarzenia z dodatkowymi współrzędnymi (latitude i longitude)
    const event = await prisma.event.create({
      data: {
        location,
        address,
        startDate: parsedStart,
        endDate: parsedEnd,
        activity,
        creatorId: Number(creatorId),
        maxParticipants: Number(spots),
        genderBalance: genderSplit ?? false,
        minAge: minAge ?? 0,
        maxAge: maxAge ?? 99,
        latitude,  // Zapisujemy współrzędną szerokości geograficznej
        longitude, // Zapisujemy współrzędną długości geograficznej
      },
    });

    const creator = await prisma.user.findUnique({
      where: { id: Number(creatorId) },
      select: { userName: true, avatarUrl: true },
    });

    const userName = creator?.userName ?? "Użytkownik";
    const avatarUrl = creator?.avatarUrl ?? null;

    const joinedCount = await prisma.eventParticipant.count({
      where: { eventId: event.id },
    });

    const interests = await prisma.user.findMany({
      where: {
        userInterests: {
          some: {
            activity,
          },
        },
        ...(event.minAge !== null && event.maxAge !== null
          ? {
              age: {
                gte: event.minAge,
                lte: event.maxAge,
              },
            }
          : {}),
        id: {
          not: Number(creatorId),
        },
      },
    });

    const userIds = interests.map((user: { id: number }) => user.id);

    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
    });

    const fullAddress = address || location || "nieokreślona lokalizacja";

    const messages = tokens
      .filter((t: { token: unknown }) => Expo.isExpoPushToken(t.token))
      .map((t: { token: any }) => ({
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
          creatorAvatar: avatarUrl,
        },
      }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    await Promise.all(
      userIds.map((userId: number) =>
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
