
import { Request, Response } from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const expo = new Expo();

export const createEventController = async (req: Request, res: Response) => {
  const { location, address, startDate, endDate, activity, creatorId } = req.body;

  try {
    const event = await prisma.event.create({
      data: {
        location,
        address,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        activity,
        creatorId,
      },
    });

    const interests = await prisma.userInterest.findMany({
      where: {
        activity,
        userId: { not: creatorId },
      },
    });

    const userIds = interests.map((i: { userId: any; }) => i.userId);

    const tokens = await prisma.pushToken.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    const messages = tokens
      .filter((t: { token: unknown; }) => Expo.isExpoPushToken(t.token))
      .map((t: { token: any; }) => ({
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
    console.error("❌ Błąd tworzenia eventu:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
