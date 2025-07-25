import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getJoinedEventsController = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId" });

  try {
    const now = new Date();

    // 1️⃣ Wydarzenia stworzone przez użytkownika
    const createdEvents = await prisma.event.findMany({
      where: {
        creatorId: userId,
        endDate: { gt: now },
      },
      include: {
        creator: { select: { userName: true } },
        eventParticipants: {
          select: { userId: true },
        },
      },
    });

    // 2️⃣ Wydarzenia, do których użytkownik dołączył (ale NIE stworzył)
    const joinedEvents = await prisma.event.findMany({
      where: {
        eventParticipants: {
          some: {
            userId,
          },
        },
        creatorId: {
          not: userId,
        },
        endDate: { gt: now },
      },
      include: {
        creator: { select: { userName: true } },
        eventParticipants: {
          select: { userId: true },
        },
      },
    });

    // 3️⃣ Mapowanie i oznaczanie
    const formatEvent = (event: any, isCreator: boolean) => ({
      id: event.id,
      activity: event.activity,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      creator: event.creator,
      spots: event.maxParticipants,
      participantsCount: event.eventParticipants.length,
      isUserJoined: event.eventParticipants.some((p: any) => p.userId === userId),
      isCreator,
    });

    const result = [
      ...createdEvents.map((e) => formatEvent(e, true)),
      ...joinedEvents.map((e) => formatEvent(e, false)),
    ];

    console.log("📦 Wynik /api/event/joined:", result);

    res.json(result);
  } catch (err) {
    console.error("❌ Błąd pobierania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
