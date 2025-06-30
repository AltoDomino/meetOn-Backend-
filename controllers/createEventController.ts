import { Request, Response } from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const expo = new Expo();

export const createEventController = async (req: Request, res: Response) => {
  const { location, address, startDate, endDate, activity, creatorId, spots } = req.body;

  try {
    // 🧪 Logowanie do debugowania
    console.log("📥 Otrzymano dane:", req.body);

    // Konwersja dat
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const now = new Date();

    console.log("🕒 Parsed startDate:", parsedStart);
    console.log("🕒 Parsed endDate:", parsedEnd);
    console.log("🕒 Aktualna data:", now);

    // Walidacja dat
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowy format daty." });
    }

    if (parsedStart <= now) {
      return res.status(400).json({ error: "Data rozpoczęcia musi być w przyszłości." });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: "Data zakończenia musi być po rozpoczęciu." });
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
      },
    });

    // Znalezienie użytkowników zainteresowanych tą aktywnością (bez twórcy)
    const interests = await prisma.userInterest.findMany({
      where: {
        activity,
        userId: { not: creatorId },
      },
    });

    const userIds = interests.map(i => i.userId);

    const tokens = await prisma.pushToken.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    const messages = tokens
      .filter(t => Expo.isExpoPushToken(t.token))
      .map(t => ({
        to: t.token,
        sound: "default",
        title: "Nowe wydarzenie!",
        body: `Dodano wydarzenie z aktywnością: ${activity}`,
      }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    res.status(201).json(event);
  } catch (err) {
    console.error("❌ Błąd tworzenia wydarzenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
