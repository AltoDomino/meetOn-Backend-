import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getJoinedEventsController = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId" });

  try {
    const now = new Date();
    console.log("🔍 Sprawdzam dołączone wydarzenia dla userId:", userId);
    console.log("📅 Aktualna data:", now.toISOString());

    const joinedEvents = await prisma.eventParticipant.findMany({
      where: {
        userId,
        event: {
          endDate: {
            gt: now,
          },
        },
      },
      include: {
        event: {
          include: {
            creator: { select: { userName: true } },
          },
        },
      },
      orderBy: {
        event: {
          startDate: "asc",
        },
      },
    });

    console.log("📦 Liczba znalezionych aktywnych wydarzeń:", joinedEvents.length);

    joinedEvents.forEach((entry, i) => {
      console.log(`🔸 [${i}] EventId: ${entry.event?.id}`);
      console.log(`   ➤ Activity: ${entry.event?.activity}`);
      console.log(`   ➤ EndDate: ${entry.event?.endDate}`);
    });

    if (joinedEvents.length === 0) {
      console.log("📭 Brak aktywnych wydarzeń");
      return res.json([]);
    }

    const active = joinedEvents[0].event;

    const participantsCount = await prisma.eventParticipant.count({
      where: { eventId: active.id },
    });

    const formatted = [{
      id: active.id,
      activity: active.activity,
      location: active.location,
      startDate: active.startDate,
      endDate: active.endDate,
      creator: active.creator,
      spots: active.maxParticipants,
      participantsCount,
      isUserJoined: true,
      isCreator: false,
    }];

    console.log("✅ Zwracam aktywne wydarzenie:", formatted[0]);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Błąd pobierania dołączonych wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
