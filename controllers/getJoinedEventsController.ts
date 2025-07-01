// --- getJoinedEventsController.ts ---
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getJoinedEventsController = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId" });

  try {
    const now = new Date();

    // 1️⃣ Wydarzenia, do których dołączył jako uczestnik
    const joinedEvents = await prisma.eventParticipant.findMany({
      where: {
        userId,
        event: {
          endDate: { gt: now },
        },
      },
      include: {
        event: {
          include: {
            creator: { select: { userName: true } },
            eventParticipants: {
              include: { user: { select: { gender: true } } },
            },
          },
        },
      },
    });

    // 2️⃣ Wydarzenia, które sam stworzył (jako twórca)
    const createdEvents = await prisma.event.findMany({
      where: {
        creatorId: userId,
        endDate: { gt: now },
      },
      include: {
        creator: { select: { userName: true } },
        eventParticipants: {
          include: { user: { select: { gender: true } } },
        },
      },
    });

    // 3️⃣ Mergowanie i mapowanie
    const allEvents = [...joinedEvents.map(e => e.event), ...createdEvents];

    const uniqueEventsMap = new Map();
    allEvents.forEach((event) => {
      uniqueEventsMap.set(event.id, {
        id: event.id,
        activity: event.activity,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        creator: event.creator,
        spots: event.maxParticipants,
        participantsCount: event.eventParticipants.length,
        isUserJoined: event.eventParticipants.some(p => p.userId === userId),
        isCreator: event.creatorId === userId,
      });
    });

    const result = Array.from(uniqueEventsMap.values());

    console.log("📦 Wynik /api/event/joined:", result);

    res.json(result);
  } catch (err) {
    console.error("❌ Błąd pobierania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
