// --- getJoinedEventsController.ts ---
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getJoinedEventsController = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Brak userId" });

  try {
    const now = new Date();

    console.log("📥 userId zapytania:", userId);

    // 🔄 Pobieranie wydarzeń, gdzie user jest twórcą lub uczestnikiem
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            eventParticipants: {
              some: { userId },
            },
          },
        ],
        endDate: { gt: now },
      },
      include: {
        creator: { select: { userName: true } },
        eventParticipants: { select: { userId: true, user: { select: { gender: true } } } },
      },
    });

    console.log("🔍 Ilość znalezionych wydarzeń:", events.length);

    const result = events.map((event) => {
      const isCreator = event.creatorId === userId;
      const isUserJoined = event.eventParticipants.some((p) => p.userId === userId);

      console.log(`🧩 Event ID: ${event.id}`);
      console.log(" - Twórca ID:", event.creatorId);
      console.log(" - Czy użytkownik jest twórcą?", isCreator);
      console.log(" - Czy użytkownik dołączył?", isUserJoined);

      return {
        id: event.id,
        activity: event.activity,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        creator: event.creator,
        spots: event.maxParticipants,
        participantsCount: event.eventParticipants.length,
        isUserJoined,
        isCreator,
      };
    });

    console.log("📦 Wynik /api/event/joined:", result);

    res.json(result);
  } catch (err) {
    console.error("❌ Błąd pobierania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
